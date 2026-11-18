#!/bin/sh
set -eu

kong_container="supabase_kong_vem-pra-eja"
edge_container="supabase_edge_runtime_vem-pra-eja"
scheduler_container="vempraeja-email-scheduler-local"
env_file="supabase/functions/.env"

if ! docker inspect "$kong_container" >/dev/null 2>&1 || ! docker inspect "$edge_container" >/dev/null 2>&1; then
  echo "ERRO: o Supabase local nao esta iniciado." >&2
  exit 1
fi

if [ "$(docker inspect --format '{{.State.Running}}' "$edge_container")" != "true" ]; then
  echo "O servico local de funcoes estava parado; iniciando novamente..."
  docker start "$edge_container" >/dev/null
fi

# Os contêineres criados pelo Supabase CLI não recebem esta política por
# padrão. Ela evita que relatórios e e-mails permaneçam fora do ar após uma
# falha isolada ou depois que o Docker Desktop reiniciar.
docker update --restart unless-stopped "$edge_container" >/dev/null

gateway_api_key=$(
  docker exec "$kong_container" printenv SUPABASE_SERVICE_KEY 2>/dev/null || true
)

service_role_key=$(
  docker exec "$edge_container" printenv SUPABASE_SERVICE_ROLE_KEY
)

internal_secret_key=$(
  docker exec "$edge_container" printenv SUPABASE_INTERNAL_SECRET_KEY
)

if [ -z "$gateway_api_key" ]; then
  gateway_api_key="$internal_secret_key"
fi

bounce_check_secret=$(sed -n 's/^BOUNCE_CHECK_SECRET=//p' "$env_file" | head -n 1)
if [ ${#bounce_check_secret} -lt 32 ]; then
  echo "ERRO: BOUNCE_CHECK_SECRET local ausente ou muito curto." >&2
  exit 1
fi

if [ -z "$gateway_api_key" ] || [ -z "$service_role_key" ] || [ -z "$internal_secret_key" ]; then
  echo "ERRO: nao foi possivel obter as chaves internas do Supabase local." >&2
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
  -e GATEWAY_API_KEY="$gateway_api_key" \
  -e SERVICE_ROLE_KEY="$service_role_key" \
  -e INTERNAL_SECRET_KEY="$internal_secret_key" \
  -e BOUNCE_CHECK_SECRET="$bounce_check_secret" \
  curlimages/curl:8.12.1 \
  /bin/sh -c '
    while true; do
      curl --fail --silent --show-error \
        --request POST \
        --header "apikey: ${GATEWAY_API_KEY}" \
        --header "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        --header "X-Bounce-Check-Secret: ${BOUNCE_CHECK_SECRET}" \
        http://supabase_kong_vem-pra-eja:8000/functions/v1/verificar-retornos-email || true
      printf "\n"
      sleep 300
    done
  ' >/dev/null

echo "Agendador local iniciado. Ele recuperara a fila e consultara devolucoes a cada 5 minutos."
echo "Reinicio automatico das funcoes locais ativado."
echo "Para acompanhar: docker logs -f $scheduler_container"
