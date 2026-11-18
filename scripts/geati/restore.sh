#!/bin/sh
set -eu
arquivo="${1:-}"
test -n "$arquivo" && test -f "$arquivo" || { echo "Uso: $0 caminho/backup.dump" >&2; exit 2; }
test "${CONFIRM_RESTORE:-}" = "SIM" || { echo "Restauração altera o banco atual. Execute com CONFIRM_RESTORE=SIM após validar o alvo e possuir backup." >&2; exit 3; }
docker compose stop app
docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --clean --if-exists --no-owner --no-acl --exit-on-error --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' < "$arquivo"
docker compose run --rm migrate
docker compose up -d app
echo "Restauração concluída e migrations verificadas."
