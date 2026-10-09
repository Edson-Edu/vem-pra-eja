#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
repo_root=$(CDPATH= cd ../../../.. && pwd)
migrations_dir="$repo_root/supabase/migrations"

if [ ! -f .env ]; then
  echo "ERRO: execute scripts/prepare.sh primeiro." >&2
  exit 1
fi

if [ ! -d "$migrations_dir" ]; then
  echo "ERRO: pasta de migracoes nao encontrada." >&2
  exit 1
fi

docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table if not exists app_private.schema_migrations (
  filename text primary key,
  applied_at timestamp with time zone not null default now()
);
revoke all on table app_private.schema_migrations from public, anon, authenticated;
SQL

for migration in "$migrations_dir"/*.sql; do
  filename=$(basename "$migration")
  applied=$(docker compose exec -T db psql -U postgres -d postgres -At \
    -v migration_name="$filename" \
    -c "select exists (select 1 from app_private.schema_migrations where filename = :'migration_name');")

  if [ "$applied" = "t" ]; then
    echo "Ja aplicada: $filename"
    continue
  fi

  echo "Aplicando: $filename"
  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    --single-transaction < "$migration"

  docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -v migration_name="$filename" \
    -c "insert into app_private.schema_migrations(filename) values (:'migration_name');"
done

docker compose exec -T db psql -U postgres -d postgres \
  -c "notify pgrst, 'reload schema';" >/dev/null

echo "Migracoes concluidas."
