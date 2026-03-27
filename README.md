# DreamCMS pentru CandVisam.ro

Platforma CMS internÃƒâ€žÃ†â€™ construitÃƒâ€žÃ†â€™ folosind Next.js 14, Tailwind CSS, Prisma ÃƒË†Ã¢â€žÂ¢i MySQL.

## Rularea localÃƒâ€žÃ†â€™

1. `npm install`
2. ConfigureazÃƒâ€žÃ†â€™ `.env` cu credentialele MySQL locale
3. RuleazÃƒâ€žÃ†â€™ `npm run db:push` / `npx prisma migrate dev`
4. RuleazÃƒâ€žÃ†â€™ `npm run db:seed` pentru date iniÃƒË†Ã¢â‚¬Âºiale
5. RuleazÃƒâ€žÃ†â€™ `npm run dev`

## Deployment (CloudPanel Nginx)

SetÃƒâ€žÃ†â€™ri necesare in Vhost Config din CloudPanel (pentru domeniu candvisam.ro):

```nginx
location / {
  proxy_pass http://127.0.0.1:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}
```

Rulare PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Media & Backup
- Directorul `public/media/uploads` este generat la runtime (uploaduri). Nu se versioneaza; adauga-l in backup separat pe VPS/CloudPanel.
- Pentru restore, copiaza `public/media/uploads` in acelasi loc si ruleaza `pm2 restart ecosystem.config.js`.

## Deploy (CloudPanel)
1. Creeaza site candvisam.ro in CloudPanel (Node.js site, 20.x).
2. SSH: git clone repo in /home/candvisam.ro/htdocs/dreamcms.
3. Creeaza DB MySQL in CloudPanel, copiaza cred in .env.
4. Ruleaza: npm install, npm run build, npx prisma migrate deploy, npm run db:seed.
5. PM2: pm2 start ecosystem.config.js, pm2 save, pm2 startup.
6. CloudPanel -> Vhost Config: proxy_pass la 127.0.0.1:3001.
7. SSL: CloudPanel -> SSL/TLS -> Let\'s Encrypt -> candvisam.ro.
8. Crontab backups:
   0 2 * * * curl -s -H "X-Cron-Secret: TOKEN" https://candvisam.ro/api/backup/run?type=database
   0 3 * * 0 curl -s -H "X-Cron-Secret: TOKEN" https://candvisam.ro/api/backup/run?type=media
   0 4 1 * * curl -s -H "X-Cron-Secret: TOKEN" https://candvisam.ro/api/backup/run?type=full

## Newsletter Digest Cron

0 9 * * 1 curl -s -H 'X-Cron-Secret: TOKEN' https://candvisam.ro/api/newsletter/digest/run


## Revenue Reporting Cron

# Weekly revenue summary email (Monday 08:00)
0 8 * * 1 curl -s -H 'X-Cron-Secret: TOKEN' https://candvisam.ro/api/reports/revenue/notify

# Daily threshold alerts check (every day 09:00)
0 9 * * * curl -s -H 'X-Cron-Secret: TOKEN' https://candvisam.ro/api/reports/revenue/alerts

Optional env thresholds:
ALERT_MIN_AD_CTR=0.7
ALERT_MIN_AFFILIATE_CTR=0.15
ALERT_MIN_NEWSLETTER_CVR=0.2
ALERT_MIN_ESTIMATED_REVENUE=5



## Pre-launch validation

Run automated multisite checks (SEO/SSR/auth/routes):

`ash
npm run prelaunch:check
` 

See details in docs/prelaunch-checklist.md.


