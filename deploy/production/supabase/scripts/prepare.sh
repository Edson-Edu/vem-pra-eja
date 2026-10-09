#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ -e .env ] || [ -e .env.functions ]; then
  echo "ERRO: .env ou .env.functions ja existe. A preparacao nao sobrescreve segredos." >&2
  exit 1
fi

cp .env.example .env
cp .env.functions.example .env.functions

sed -i \
  -e 's|^COMPOSE_FILE=.*$|COMPOSE_FILE=docker-compose.yml:docker-compose.caddy.yml:docker-compose.vempraeja.yml|' \
  -e 's|^DASHBOARD_USERNAME=.*$|DASHBOARD_USERNAME=vempraeja_admin|' \
  -e 's|^SUPABASE_PUBLIC_URL=.*$|SUPABASE_PUBLIC_URL=https://vempraeja.bc.sc.gov.br|' \
  -e 's|^API_EXTERNAL_URL=.*$|API_EXTERNAL_URL=https://vempraeja.bc.sc.gov.br/auth/v1|' \
  -e 's|^SITE_URL=.*$|SITE_URL=https://vempraeja.bc.sc.gov.br|' \
  -e 's|^ADDITIONAL_REDIRECT_URLS=.*$|ADDITIONAL_REDIRECT_URLS=https://vempraeja.bc.sc.gov.br/**|' \
  -e 's|^DISABLE_SIGNUP=.*$|DISABLE_SIGNUP=true|' \
  -e 's|^SMTP_ADMIN_EMAIL=.*$|SMTP_ADMIN_EMAIL=vempraeja@bc.sc.gov.br|' \
  -e 's|^SMTP_HOST=.*$|SMTP_HOST=mail.bc.sc.gov.br|' \
  -e 's|^SMTP_PORT=.*$|SMTP_PORT=587|' \
  -e 's|^SMTP_USER=.*$|SMTP_USER=edson.tavares@bc.sc.gov.br|' \
  -e 's|^SMTP_SENDER_NAME=.*$|SMTP_SENDER_NAME=Vem Pra EJA|' \
  -e 's|^ENABLE_PHONE_SIGNUP=.*$|ENABLE_PHONE_SIGNUP=false|' \
  -e 's|^ENABLE_PHONE_AUTOCONFIRM=.*$|ENABLE_PHONE_AUTOCONFIRM=false|' \
  -e 's|^PROXY_DOMAIN=.*$|PROXY_DOMAIN=vempraeja.bc.sc.gov.br|' \
  -e 's|^CERTBOT_EMAIL=.*$|CERTBOT_EMAIL=edson.tavares@bc.sc.gov.br|' \
  .env

cat >> .env <<'EOF'

############
# Vem Pra EJA
############
AZURE_VOICE_FUNCTION_URL=https://vempraeja-voz-2026-fccbhjhadwekfncu.centralus-01.azurewebsites.net/api/voz
BOUNCE_CHECK_INTERVAL_SECONDS=300
EOF

echo "Gerando chaves exclusivas do ambiente de producao..."
sh utils/generate-keys.sh --update-env >/dev/null
sh utils/add-new-auth-keys.sh --update-env >/dev/null

printf "Senha do e-mail institucional (nao sera exibida): "
stty -echo
read -r email_password
stty echo
printf "\n"

if [ -z "$email_password" ]; then
  echo "ERRO: a senha do e-mail e obrigatoria." >&2
  exit 1
fi

escaped_password=$(printf '%s' "$email_password" | sed 's/[&|\\]/\\&/g')
sed -i "s|^SMTP_PASS=.*$|SMTP_PASS=$escaped_password|" .env
sed -i "s|^SMTP_PASSWORD=.*$|SMTP_PASSWORD=$escaped_password|" .env.functions
sed -i "s|^IMAP_PASSWORD=.*$|IMAP_PASSWORD=$escaped_password|" .env.functions

chmod 600 .env .env.functions

echo "Preparacao concluida."
echo "Confira .env e .env.functions sem copiar seus valores para chamados ou mensagens."
