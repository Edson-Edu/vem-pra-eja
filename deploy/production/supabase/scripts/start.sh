#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ] || [ ! -f .env.functions ]; then
  echo "ERRO: execute scripts/prepare.sh primeiro." >&2
  exit 1
fi

echo "Iniciando o banco para aplicar as migracoes..."
docker compose up -d --wait db

sh scripts/migrate.sh

echo "Construindo o site e iniciando todos os servicos..."
docker compose up -d --build --wait

echo "Vem Pra EJA iniciado."
echo "Site: https://vempraeja.bc.sc.gov.br"
