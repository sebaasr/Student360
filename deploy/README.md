# Deployment

## Prerequisites (Ubuntu 22.04)

```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip postgresql-15 nginx certbot \
                    python3-certbot-nginx
sudo npm install -g pm2 tsx
```

## Initial setup

```bash
git clone <repo> /opt/student360
cd /opt/student360/student360

cp .env.local.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, OIDC_*, source-system keys, ANTHROPIC_API_KEY

npm install
pip3 install -r connectors/requirements.txt

npx prisma migrate deploy
npx prisma db seed   # only on the very first run

npm run build
```

## Process management (PM2)

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd  # follow the printed instructions to enable on boot
```

## NGINX + TLS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/student360
sudo ln -s /etc/nginx/sites-available/student360 /etc/nginx/sites-enabled/
sudo certbot --nginx -d student360.ncf.edu
sudo systemctl reload nginx
```

## Cron alternative (if you don't want a Node scheduler)

```bash
crontab -e
0 2 * * * cd /opt/student360/student360/connectors && python3 run_all.py \
  >> /var/log/student360/sync.log 2>&1
```

## Health checks

```bash
pm2 status
pm2 logs student360
pm2 logs student360-scheduler

# Sync history
psql $DATABASE_URL -c 'SELECT connector, status, "startedAt", "recordsProcessed", "errorCount" \
  FROM "SyncRun" ORDER BY "startedAt" DESC LIMIT 20;'
```
