FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_BROWSER_TOKEN
ARG PUBLIC_AZURE_VOICE_FUNCTION_URL

RUN NEXT_PUBLIC_SUPABASE_URL="${PUBLIC_SUPABASE_URL}" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="${PUBLIC_SUPABASE_BROWSER_TOKEN}" \
    AZURE_VOICE_FUNCTION_URL="${PUBLIC_AZURE_VOICE_FUNCTION_URL}" \
    npm run check

FROM nginx:1.28-alpine

COPY deploy/production/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
