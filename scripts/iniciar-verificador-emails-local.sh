#!/bin/sh
set -eu

kong_container="supabase_kong_vem-pra-eja"
edge_container="supabase_edge_runtime_vem-pra-eja"
scheduler_container="vempraeja-email-scheduler-local"
env_file="supabase/functions/.env"

if ! docker inspect "$kong_container" >/dev/null 2>&1; then
  echo "ERRO: o Supabase local nao esta iniciado." >&2
  exit 1
fi

service_role_key=$(
  docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$edge_container" |
    sed -n 's/^SUPABASE_SERVICE_ROLE_KEY=//p' |
    head -n 1
)

if [ -z "$service_role_key" ]; then
  service_role_key=$(
    docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$kong_container" |
      sed -n 's/^SUPABASE_SERVICE_KEY=//p' |
      head -n 1
  )
fi

bounce_check_secret=$(sed -n 's/^BOUNCE_CHECK_SECRET=//p' "$env_file" | head -n 1)
if [ ${#bounce_check_secret} -lt 32 ]; then
  echo "ERRO: BOUNCE_CHECK_SECRET local ausente ou muito curto." >&2
  exit 1
fi

if [ -z "$service_role_key" ]; then
  echo "ERRO: nao foi possivel obter a chave interna do Supabase local." >&2
  exit 1
fi

network_name=$(
  docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{end}}' "$kong_container"
)

docker rm -f "$scheduler_container" >/dev/null 2>&1 || true
docker run -d \
  --name "$scheduler_container" \
  --restart unless-stopped \
  --network "$network_name" \
  -e SERVICE_ROLE_KEY="$service_role_key" \
  -e BOUNCE_CHECK_SECRET="$bounce_check_secret" \
  curlimages/curl:8.12.1 \
  /bin/sh -c '
    while true; do
      curl --fail --silent --show-error \
        --request POST \
        --header "apikey: ${SERVICE_ROLE_KEY}" \
        --header "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        --header "X-Bounce-Check-Secret: ${BOUNCE_CHECK_SECRET}" \
        http://supabase_kong_vem-pra-eja:8000/functions/v1/verificar-retornos-email || true
      printf "\n"
      sleep 300
    done
  ' >/dev/null

echo "Verificador local iniciado. Ele consultara as devolucoes a cada 5 minutos."
echo "Para acompanhar: docker logs -f $scheduler_container"
