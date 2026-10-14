#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

command -v jq >/dev/null 2>&1 || {
  echo "ERRO: instale jq antes de criar o administrador." >&2
  exit 1
}

admin_email="${1:-edson.tavares@bc.sc.gov.br}"

printf "Senha inicial do administrador %s: " "$admin_email"
stty -echo
read -r admin_password
stty echo
printf "\n"

if [ ${#admin_password} -lt 12 ]; then
  echo "ERRO: use uma senha com pelo menos 12 caracteres." >&2
  exit 1
fi

payload=$(jq -nc \
  --arg email "$admin_email" \
  --arg password "$admin_password" \
  '{email:$email,password:$password,email_confirm:true}')

docker compose exec -T \
  -e ADMIN_PAYLOAD="$payload" \
  email-bounce-scheduler \
  sh -c 'printf "%s" "$ADMIN_PAYLOAD" | curl --fail-with-body --silent --show-error \
    --request POST \
    --header "apikey: $SERVICE_ROLE_KEY" \
    --header "Authorization: Bearer $SERVICE_ROLE_KEY" \
    --header "Content-Type: application/json" \
    --data-binary @- \
    http://api-gw:8000/auth/v1/admin/users' >/dev/null

docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -v admin_email="$admin_email" <<'SQL'
delete from public.administradores where email = 'admin@vempraeja-novo.app';
insert into public.administradores(email)
values (lower(:'admin_email'))
on conflict (email) do update set ativo = true;
SQL

escaped_email=$(printf '%s' "$admin_email" | sed 's/[&|\\]/\\&/g')
sed -i "s|^ADMIN_EMAIL=.*$|ADMIN_EMAIL=$escaped_email|" .env
sed -i "s|^ANALYTICS_ADMIN_EMAIL=.*$|ANALYTICS_ADMIN_EMAIL=$escaped_email|" .env.functions
docker compose up -d --wait --force-recreate --no-deps functions
docker compose up -d --wait --build --no-deps web

echo "Administrador criado e autorizado: $admin_email"
