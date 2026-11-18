#!/bin/sh
set -eu
umask 077
destino="${1:-./backups}"
mkdir -p "$destino"
arquivo="$destino/vempraeja-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump --format=custom --no-owner --no-acl --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' > "$arquivo"
test -s "$arquivo"
echo "Backup criado: $arquivo"
