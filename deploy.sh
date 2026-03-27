#!/bin/bash
echo "?? DreamCMS Deploy — $(date)"
cd /home/candvisam.ro/htdocs/dreamcms
bash backup-before-deploy.sh
git pull origin main
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart dreamcms
pm2 save
echo "? Deploy complet!"
