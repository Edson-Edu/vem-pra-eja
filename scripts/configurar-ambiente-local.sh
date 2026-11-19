#!/bin/sh

set -eu

raiz=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
destino="$raiz/.env"

if [ -e "$destino" ] && [ "${1:-}" != "--force" ]; then
  echo ".env já existe. Use --force somente para substituir a configuração local." >&2
  exit 1
fi

command -v openssl >/dev/null 2>&1 || {
  echo "openssl é necessário para gerar os segredos locais." >&2
  exit 1
}

temporario=$(mktemp "$raiz/.env.tmp.XXXXXX")
trap 'rm -f "$temporario"' EXIT HUP INT TERM
umask 077
cp "$raiz/.env.example" "$temporario"

migration_secret=$(openssl rand -hex 32)
app_secret=$(openssl rand -hex 32)
rate_secret=$(openssl rand -hex 32)
login_secret=$(openssl rand -hex 32)

sed -i \
  -e "s|^MIGRATION_DB_PASSWORD=.*|MIGRATION_DB_PASSWORD=$migration_secret|" \
  -e "s|^APP_DB_PASSWORD=.*|APP_DB_PASSWORD=$app_secret|" \
  -e 's|^APP_ORIGIN=.*|APP_ORIGIN=http://localhost:3000|' \
  -e 's|^TRUST_PROXY=.*|TRUST_PROXY=false|' \
  -e "s|^RATE_LIMIT_SECRET=.*|RATE_LIMIT_SECRET=$rate_secret|" \
  -e "s|^LOGIN_RATE_LIMIT_SECRET=.*|LOGIN_RATE_LIMIT_SECRET=$login_secret|" \
  "$temporario"

chmod 600 "$temporario"
mv -f "$temporario" "$destino"
trap - EXIT HUP INT TERM

echo "Ambiente local criado em .env (segredos ocultos; permissões 600)."
