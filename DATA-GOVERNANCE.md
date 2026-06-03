# Student 360 — Data Governance & FERPA Compliance Policy

**Institution:** New College of Florida
**System:** Student 360 — Unified Advising Dashboard
**Classification:** Confidential
**Document owner:** Office of the Associate Provost
**Status:** Draft for review — requires sign-off before production launch

| Approver | Role | Signature | Date |
|---|---|---|---|
| | Registrar | | |
| | General Counsel | | |
| | IT Security Officer | | |
| | Associate Provost | | |

> This document satisfies the data-governance sign-off required in Section 7.1(8)
> of the Student 360 Project Proposal. It must be reviewed and signed by the
> Registrar, General Counsel, and IT Security before the system processes any
> live student data.

---

## 1. Purpose & Scope

Student 360 aggregates personally identifiable student information (PII) from five
source systems into a single read-only dashboard for academic advising. Because it
consolidates protected education records, it is subject to the Family Educational
Rights and Privacy Act (FERPA, 20 U.S.C. § 1232g) and NCF institutional policy.

This policy defines:
- What data is collected and from where
- The legal basis for access
- How access is controlled, logged, and audited
- How data is protected in transit, at rest, and in processing
- Hosting, retention, incident response, and stewardship responsibilities

**Scope:** all student data ingested, stored, displayed, or processed by Student 360,
its data connectors, and its predictive-insights layer.

---

## 2. Data Classification

All data handled by Student 360 is classified as **Confidential — Protected Education
Records** under FERPA. This includes, but is not limited to:

| Category | Examples | Source |
|---|---|---|
| Identity | Name, NCF ID, email, contact info | Banner |
| Academic | GPA, standing, credits, AOC, enrollment | Banner / DegreeWorks |
| Narrative evaluations | Full text of faculty evaluations | NCF Evaluations |
| Advising | Notes, appointments, early alerts, referrals | Navigate 360 |
| Support | Tutoring sessions, SSC visits, coaching | Knack |
| Athletics | Eligibility status, GPA thresholds | Banner / FAR |
| Financial | Holds, aid status (flag-level only) | Banner |
| Derived | AI-generated predictive insights | Computed internally |

**No data outside this documented list is extracted from any source system,
regardless of technical accessibility (data minimization — see § 6.5).**

---

## 3. The Aggregation Risk

Student 360's core function — consolidating five systems into one warehouse — also
creates its principal risk. Before Student 360, a student's PII is distributed across
five platforms, each with independent access controls. Student 360 unifies it, creating
a **single high-value repository** of complete student records.

This concentration is the reason this governance policy exists. Every control in this
document is designed to ensure the aggregated warehouse is protected **more rigorously**
than any individual source system, not less.

---

## 4. Legal Basis for Access — FERPA Legitimate Educational Interest

Access is governed by FERPA's **legitimate educational interest** standard: a user may
access only the student data necessary to perform their official institutional function.

This is enforced through a nine-tier role-based access control (RBAC) model. Each tier
defines (a) which students a user may view and (b) which data panels are available.

| Tier | Role | Students Visible | Restricted From |
|---|---|---|---|
| 1 | Faculty Advisor | Assigned advisees | — |
| 2 | Academic Coach | Assigned students | Financial, full evaluations |
| 3 | AOC Director | Students in their AOC | Financial |
| 4 | Athletics Staff | Certified student-athletes | Evaluations, financial detail |
| 5 | Financial Aid | All students | Academics, advising notes |
| 6 | Dean of Students | All students | Financial account detail |
| 7 | Registrar | All students | — (full read) |
| 8 | Provost's Office | All students | — (full read + analytics) |
| 9 | IT Administrator | **No student records** | All student data by design |

Tiers are assigned through NCF's Single Sign-On identity provider and **cannot be
elevated by the user**. Access is enforced at the **API layer on every request** — not
in the user interface. A user cannot retrieve records outside their tier even with
direct access to the browser console or network tools.

---

## 5. Data Flow & Where PII Lives

```
  Source systems          Connectors           Warehouse           Application
 ┌──────────────┐       ┌────────────┐       ┌────────────┐       ┌────────────┐
 │ Banner       │──TLS─▶│            │       │            │       │            │
 │ DegreeWorks  │──TLS─▶│  Python    │──────▶│ PostgreSQL │──────▶│ Student360 │
 │ Navigate 360 │──TLS─▶│ connectors │ write │ (encrypted │ read  │  (RBAC +   │
 │ Knack        │──TLS─▶│ (read-only)│       │  at rest)  │       │   audit)   │
 │ Evaluations  │──TLS─▶│            │       │            │       │            │
 └──────────────┘       └────────────┘       └────────────┘       └────────────┘
     systems of            nightly sync         single             authenticated
       record               (2 AM)              warehouse            advisors
```

**Student 360 is strictly read-only. It never writes back to any source system.**
When an advisor needs to take an action, they are deep-linked to the system of record,
which enforces its own authentication.

PII exists at four points, each protected (§ 6):
1. **In transit** — between source APIs and connectors
2. **In processing** — in connector memory during transform
3. **At rest** — in the PostgreSQL warehouse (highest concentration)
4. **In display** — rendered to authorized advisors only

---

## 6. Required Protections

### 6.1 Encryption in Transit
All data moving between source systems, connectors, the database, and users is
encrypted via TLS 1.2+. No PII traverses any network unencrypted.

### 6.2 Encryption at Rest
The PostgreSQL warehouse is encrypted at rest. Database backups are encrypted and
stored on a separate, access-controlled volume.

### 6.3 Secrets Management
All API keys, database credentials, and SSO secrets are stored in a secrets manager
(HashiCorp Vault or equivalent) — **never in code repositories or plaintext files in
version control**. Credentials are rotated at least annually and immediately upon any
suspected compromise.

### 6.4 Least-Privilege Source Accounts
Each connector authenticates to its source system using a dedicated, **read-only**
service account scoped to the minimum fields required. A compromised connector
credential cannot write to a source system or read undocumented fields.

### 6.5 Data Minimization
Connectors extract only the fields enumerated in § 2. Fields not displayed or used by
Student 360 are never extracted, regardless of technical accessibility.

### 6.6 No Logging of PII
Application and connector logs record identifiers, counts, and status only — never full
student records, evaluation text, or contact information. Error messages returned to the
client never contain PII.

### 6.7 Network Isolation
The warehouse is accessible only from the application server. No direct user or public
network access to the database is permitted.

---

## 7. Hosting Requirement

**Student 360 processing live student data must run on NCF-managed infrastructure,
inside NCF's network perimeter** (Proposal § 8). The application is not exposed to the
public internet; it is available on the NCF internal network and via institutional VPN.

> **Note on the public demo:** A demonstration instance may run on external cloud
> hosting (e.g., Vercel) **only with fully synthetic data**. No live or real student
> PII may be deployed to any third-party cloud platform. Crossing this line is a FERPA
> violation.

---

## 8. AI / External Processing Controls

The predictive-insights layer uses an AI model for thematic pattern detection across
course and evaluation text. This is the only point at which student data could leave NCF
infrastructure, and it is therefore subject to specific controls:

1. **Rule-based insights** (minor proximity, ISP pacing, GPA trends, support gaps) are
   computed **internally with no external API call.**
2. **The natural-language query interface** transmits only the advisor's question to the
   AI provider — **never student data.**
3. **Thematic pattern detection**, which requires evaluation text, must either:
   - **(a)** anonymize the text — stripping name, ID, and any direct identifier — before
     transmission, so the subject cannot be re-identified; **or**
   - **(b)** operate only under a signed Business Associate Agreement / Data Processing
     Agreement with the AI provider.
4. AI-generated insights are labeled "For advisor use only," are never visible to
   students, and are never transmitted outside NCF systems.

No predictive feature may send identifiable student PII to an external service without
control (a) or (b) in place.

---

## 9. Audit Logging & Retention

Every access to a student record is logged with: user ID, user tier, student ID
accessed, data panel(s) viewed, action, timestamp, IP address, and user agent.

- Logs are **immutable** — no user, including IT administrators, can alter them.
- Logs are retained for a **minimum of five (5) years**.
- Logs are available to the Registrar and General Counsel on request, including for
  FERPA records-access requests.

**Sample FERPA access query** (all accesses to one student):
```sql
SELECT a."createdAt", u.email, u."accessTier", a.action, a."panelName", a."ipAddress"
FROM "AuditLog" a JOIN "User" u ON u.id = a."userId"
WHERE a."studentId" = :studentId
ORDER BY a."createdAt" DESC;
```

---

## 10. Authentication

- Authentication is handled **exclusively** through NCF's SSO identity provider
  (Microsoft Entra / Okta). Student 360 maintains no independent password store.
- **Multi-factor authentication is required** for all users.
- Faculty advisor assignments sync nightly from Banner; coach assignments from Knack;
  Athletics/Financial Aid/Dean access is provisioned by IT from HR role; Registrar and
  Provost access is provisioned manually by the IT administrator.

---

## 11. Incident Response

In the event of a suspected unauthorized disclosure or security incident:
1. Immediate notification to the IT Security team and the Registrar.
2. Suspension of affected access credentials.
3. Preservation of audit logs.
4. Assessment of scope and affected records.
5. Notification to impacted students as required by FERPA and NCF policy.
6. Post-incident review and updated controls.

A written incident-response runbook will be maintained and tested before launch.

---

## 12. Roles & Responsibilities (Data Stewardship)

| Role | Responsibility |
|---|---|
| **Registrar** | Data steward of record; approves field list, access tiers, retention |
| **General Counsel** | FERPA legal review; approves AI processing controls |
| **IT Security** | Encryption, secrets, network isolation, penetration testing |
| **IT Administrator** | User provisioning, sync monitoring, backups, patching |
| **Associate Provost** | System owner; governance review cadence |
| **Faculty Advisors / Staff** | Access only within tier; report suspected misuse |

---

## 13. Review & Maintenance

- This policy is reviewed **annually** and upon any material change to data sources,
  access tiers, or the AI layer.
- A pre-launch checklist (below) must be completed before production go-live.

### Pre-Launch FERPA Checklist
- [ ] Field list (§ 2) approved by the Registrar
- [ ] RBAC tier definitions (§ 4) approved by the Registrar
- [ ] Encryption at rest verified on the production database
- [ ] Secrets moved to a secrets manager; no credentials in source control
- [ ] Source-system accounts confirmed read-only and minimum-scope
- [ ] AI processing control (§ 8.3) in place — anonymization or signed DPA
- [ ] Audit logging verified immutable with 5-year retention
- [ ] SSO + MFA integration tested
- [ ] Production hosting confirmed inside NCF perimeter (not public cloud)
- [ ] Incident-response runbook written and tested
- [ ] This policy signed by Registrar, General Counsel, and IT Security

---

*Office of the Associate Provost · New College of Florida*
*Questions: mlopezzafra@ncf.edu*
