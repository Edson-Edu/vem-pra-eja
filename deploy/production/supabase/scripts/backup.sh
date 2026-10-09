#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
destination="$backup_dir/vempraeja-$timestamp.dump"

docker compose exec -T db pg_dump \
  -U postgres \
  -d postgres \
  --format=custom \
  --no-owner \
  --no-acl > "$destination"

chmod 600 "$destination"
echo "Backup criado em: $destination"
