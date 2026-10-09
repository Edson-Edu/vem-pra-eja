#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

docker compose ps

echo
echo "Teste do site:"
curl --fail --silent --show-error --head https://vempraeja.bc.sc.gov.br/ | head -n 1

echo "Teste da autenticacao:"
status=$(curl --silent --output /dev/null --write-out '%{http_code}' \
  https://vempraeja.bc.sc.gov.br/auth/v1/)
[ "$status" = "401" ] || {
  echo "ERRO: Auth respondeu HTTP $status; esperado 401." >&2
  exit 1
}
echo "Auth respondeu 401 como esperado."
