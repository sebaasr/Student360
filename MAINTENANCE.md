# Student 360 — Maintenance Guide

For: NCF IT Department & Associate Provost Office  
Last updated: June 2026

---

## 1. Day-to-day operations

### Checking if the nightly sync ran

Every connector run is logged in the `SyncRun` table. To see recent runs:

```bash
npx prisma studio
# Open http://localhost:5555 → SyncRun table
```

Or query directly:
```sql
SELECT connector, status, startedAt, recordsProcessed, errorCount
FROM SyncRun
ORDER BY startedAt DESC
LIMIT 20;
```

If a connector shows `status = "failed"` two consecutive nights, IT receives an alert email (configure `ALERT_EMAIL` in `.env.local`).

### Restarting the app after a crash

The app runs under PM2 on the NCF server:

```bash
pm2 status                  # see if student360 is running
pm2 restart student360      # restart the web app
pm2 restart student360-scheduler  # restart the nightly sync
pm2 logs student360         # view live logs
pm2 logs student360 --lines 200   # view last 200 log lines
```

### Pulling a new update from GitHub

```bash
cd /path/to/student360
git pull origin main
npm install
npm run build
pm2 restart student360
```

---

## 2. Managing users

Users are stored in the `User` table with an `accessTier` field (1–9).  
Tiers are defined in `lib/rbac.ts`. Summary:

| Tier | Role | Sees |
|---|---|---|
| 1 | Faculty Advisor | Own advisees only |
| 2 | Academic Coach | Assigned students only |
| 3 | AOC Director | Students in their AOC |
| 4 | Athletics Staff | Certified student-athletes |
| 5 | Financial Aid | All students (financial only) |
| 6 | Dean of Students | All students |
| 7 | Registrar | All students, full access |
| 8 | Provost Office | All students, full access |
| 9 | IT Administrator | No student data |

### Adding a new user

In dev (SQLite), run:
```bash
npx tsx scripts/add-user.ts   # or use prisma studio
```

In production, insert directly:
```sql
INSERT INTO "User" (id, email, name, "accessTier", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'newuser@ncf.edu', 'Full Name', 1, true, now(), now());
```

### Changing a user's access tier

```sql
UPDATE "User" SET "accessTier" = 7 WHERE email = 'registrar@ncf.edu';
```

### Deactivating a user (does not delete audit logs)

```sql
UPDATE "User" SET "isActive" = false WHERE email = 'departed@ncf.edu';
```

---

## 3. Data sync architecture

### How it works

Every night at 2 AM the scheduler (`workers/scheduler.ts`) triggers each Python connector:

```
connectors/
  banner_connector.py        → pulls student identity, GPA, enrollment from Banner
  degreeworks_connector.py   → pulls degree progress, ISPs, minors from DegreeWorks
  navigate_connector.py      → pulls advising records, early alerts from Navigate 360
  knack_tutoring_connector.py → pulls tutoring sessions from Knack
  knack_ssc_connector.py     → pulls SSC visits and coach assignments from Knack
  evaluations_connector.py   → pulls narrative evaluations from NCF Evaluations system
  predictive_engine.py       → runs rule-based insight analysis after all syncs complete
```

Each connector authenticates with its source system, extracts changed records, and writes them to the PostgreSQL database. A `SyncRun` record is created for each run.

### Triggering a manual sync

```bash
cd connectors
python run_all.py             # run all connectors now
python banner_connector.py    # run one specific connector
```

Or from the web UI (Provost/Registrar tier): Admin → Trigger Sync.

### Adding a connector for a new data source

1. Copy `connectors/banner_connector.py` as a template
2. Implement the `fetch()` and `upsert()` methods
3. Add it to `connectors/run_all.py`
4. Add credentials to `.env.local`
5. Test with `python your_connector.py --dry-run`

---

## 4. Database

### Backups

Configure daily automated backups in the server cron:

```bash
# /etc/cron.d/student360-backup
0 3 * * * postgres pg_dump student360 | gzip > /backups/student360-$(date +\%Y\%m\%d).sql.gz
```

Keep 30 days of backups. Test restore monthly:
```bash
gunzip < /backups/student360-20260601.sql.gz | psql student360_restore
```

### Applying a schema change

```bash
# After editing prisma/schema.prisma:
npx prisma migrate dev --name describe_the_change   # creates migration file
git add prisma/migrations
git commit -m "db: add xyz field"
git push

# On the production server after pulling:
npx prisma migrate deploy
pm2 restart student360
```

### Resetting the dev database (dev only, destroys all data)

```bash
npx prisma migrate reset --force   # resets and re-runs seed
```

---

## 5. Source system credentials

All credentials live in `.env.local` (never committed to git). Required variables:

```
DATABASE_URL=postgresql://...
AUTH_SECRET=...
DEV_AUTH_ENABLED=true          # set false in production

# NCF SSO (production)
OIDC_ISSUER=https://login.microsoftonline.com/...
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...

# Source system APIs
BANNER_API_URL=...
BANNER_API_KEY=...
DEGREEWORKS_API_URL=...
DEGREEWORKS_API_KEY=...
NAVIGATE_API_URL=...
NAVIGATE_API_KEY=...
KNACK_APP_ID=...
KNACK_API_KEY=...

# AI layer
ANTHROPIC_API_KEY=...

# Bright Futures thresholds (match current state requirements)
BRIGHT_FUTURES_ACADEMIC_GPA=3.0
BRIGHT_FUTURES_MEDALLION_GPA=2.75
BRIGHT_FUTURES_GOLD_GPA=2.0
```

Rotate credentials annually or immediately if compromised. Store the master copy in NCF's password manager.

---

## 6. Where data comes from

Student 360 is a **read-only mirror** — it never writes back to any source system.

| Data | Source system | Update frequency |
|---|---|---|
| Student identity, GPA, enrollment | Banner (Ellucian) | Nightly |
| Degree progress, ISPs, minors, thesis | DegreeWorks (Ellucian) | Weekly (Sundays) |
| Advising records, early alerts | Navigate 360 (EAB) | Nightly |
| Tutoring sessions, no-shows | Knack | Nightly |
| SSC visits, academic coach | Banner (Ellucian) | Weekly (Sundays) |
| Narrative evaluations | NCF Evaluations System | Weekly (Sundays) |
| Predictive insights | Computed internally | After each nightly sync |

If data looks wrong in Student 360, the fix should be made in the **source system**, not in Student 360. The next sync will pick it up.

---

## 7. FERPA audit logs

Every student record access is logged in `AuditLog`. Logs are immutable and retained for 5 years per FERPA requirement.

To pull access logs for a specific student (for a FERPA request):
```sql
SELECT al."createdAt", u.email, u."accessTier", al.action, al."panelName", al."ipAddress"
FROM "AuditLog" al
JOIN "User" u ON u.id = al."userId"
WHERE al."studentId" = 'N2024-0087'
ORDER BY al."createdAt" DESC;
```

---

## 8. Contacts

| Role | Contact |
|---|---|
| Project owner | Manuel Lopez — mlopezzafra@ncf.edu |
| IT liaison | TBD |
| Development | TBD |
| Registrar | TBD |
