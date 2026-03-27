#!/bin/bash
set -e
BACKUP_PATH=${BACKUP_PATH:-/home/candvisam.ro/backups}
DATE=$(date +"%Y-%m-%d-%H%M")
mkdir -p "$BACKUP_PATH/db"
mysqldump -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" "$DB_NAME" | gzip > "$BACKUP_PATH/db/${DATE}-dreamcms.sql.gz"
