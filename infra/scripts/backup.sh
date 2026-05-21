#!/usr/bin/env bash
# Backup analytics.db to S3. Keeps 7 days of history.
# Usage: bash /home/ubuntu/itsjaya/infra/scripts/backup.sh
# Cron:  0 2 * * * /bin/bash /home/ubuntu/itsjaya/infra/scripts/backup.sh >> /data/logs/backup.log 2>&1
set -euo pipefail

DB_PATH="/data/analytics.db"
S3_BUCKET="${ITSJAYA_BACKUP_BUCKET:-itsjaya-backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
S3_KEY="analytics_db/${TIMESTAMP}_analytics.db"
LATEST_KEY="analytics_db/latest_analytics.db"

if [ ! -f "$DB_PATH" ]; then
  echo "[backup] ERROR: Database not found at $DB_PATH"
  exit 1
fi

echo "[backup] Uploading to s3://${S3_BUCKET}/${S3_KEY} ..."
aws s3 cp "$DB_PATH" "s3://${S3_BUCKET}/${S3_KEY}"
aws s3 cp "$DB_PATH" "s3://${S3_BUCKET}/${LATEST_KEY}"
echo "[backup] Upload complete."

# Prune backups older than 7 days
CUTOFF=$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v -7d +%Y-%m-%d)
echo "[backup] Pruning backups older than $CUTOFF..."
aws s3 ls "s3://${S3_BUCKET}/analytics_db/" | while read -r line; do
  FILE_DATE=$(echo "$line" | awk '{print $1}')
  FILE_NAME=$(echo "$line" | awk '{print $4}')
  if [[ "$FILE_NAME" == "latest_analytics.db" ]]; then continue; fi
  if [[ "$FILE_DATE" < "$CUTOFF" ]]; then
    echo "[backup] Removing: $FILE_NAME"
    aws s3 rm "s3://${S3_BUCKET}/analytics_db/${FILE_NAME}"
  fi
done
echo "[backup] Done."
