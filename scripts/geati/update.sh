#!/bin/sh
set -eu
./scripts/geati/backup.sh
docker compose build --pull app migrate
docker compose run --rm migrate
docker compose up -d --remove-orphans app db
docker compose ps
