# Manual de implantação para o GEATI

## Checklist de homologação

- [ ] Revisar `.env` e guardar segredos no mecanismo institucional.
- [ ] Confirmar domínio, DNS, certificado e `APP_ORIGIN`.
- [ ] Garantir que 5432 não possui publicação externa.
- [ ] Executar migrations e criar administrador nominal.
- [ ] Confirmar que o banco iniciou vazio e cadastrar uma escola real pelo painel.
- [ ] Testar login, cadastro/edição/ativação/exclusão de escola e persistência após reinício.
- [ ] Testar mapa, filtros, teclado, contraste, voz, VLibras e celulares.
- [ ] Confirmar política/provedor de mapas e eventual Azure Speech.
- [ ] Configurar backups, cópia externa, monitoramento e retenção de logs.
- [ ] Fazer teste de restauração antes da produção.

## Sequência inicial

```bash
git clone URL_DO_REPOSITORIO vempraeja
cd vempraeja
cp .env.example .env
# editar .env em canal seguro
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 migrate app db
curl --fail http://127.0.0.1:${APP_PORT:-3000}/api/health
docker compose run --rm migrate npm run admin -- create admin@instituicao.br
```

O PostgreSQL é iniciado apenas com a estrutura. Não há importação do Supabase, seed de escolas ou WhatsApps provisórios.

Não use `docker compose down -v` em produção: `-v` remove o volume do banco. Não execute `docker volume prune` no host sem inventário e backup verificado.

## Proxy Nginx de referência

Adapte ao padrão institucional:

```nginx
server {
  listen 443 ssl http2;
  server_name eja.exemplo.edu.br;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
```

Como `TRUST_PROXY=true`, o proxy deve substituir cabeçalhos de IP enviados pelo cliente. Se isso não puder ser garantido, use `TRUST_PROXY=false`; o rate limit continuará funcionando por origem local, com menor granularidade.

## Atualização

Em uma janela de manutenção:

```bash
git fetch --all --prune
git checkout codex/geati-deploy   # ou a tag aprovada
git pull --ff-only
./scripts/geati/update.sh
docker compose logs --tail=100 app migrate
curl --fail http://127.0.0.1:${APP_PORT:-3000}/api/health
```

Em produção, prefira tags/commits aprovados e imagens publicadas por CI. O script cria dump antes de alterar contêineres. Migrations novas devem ser compatíveis com a versão anterior durante o rollout; mudanças destrutivas exigem procedimento separado e aprovação.

## Backup e restauração

Agende `backup.sh` com usuário operacional restrito. Copie o dump para armazenamento externo criptografado, registre sucesso/falha e aplique a retenção institucional. O volume local não é backup.

Restauração deve ocorrer primeiro em homologação:

```bash
./scripts/geati/backup.sh /backup/antes-da-restauracao
CONFIRM_RESTORE=SIM ./scripts/geati/restore.sh /backup/vempraeja-AAAAMMDD.dump
```

O restore usa `--clean --if-exists`; portanto altera o banco alvo. Verifique host, arquivo, backup atual e janela antes de confirmar.

## Monitoramento

Monitorar pelo menos:

- estado/healthcheck dos contêineres;
- resposta de `/api/health`;
- uso do volume e crescimento do PostgreSQL;
- falhas/reinícios do app e do banco;
- resultado e idade do último backup;
- expiração do certificado;
- códigos 429/5xx sem registrar corpos sensíveis.

## Incidentes e rollback

1. Registrar o commit/imagem e horário.
2. Preservar logs necessários sob controle de acesso.
3. Se o erro for apenas no app, voltar à imagem/tag anterior sem tocar no volume.
4. Se migration incompatível alterou dados, parar app e seguir o procedimento de restauração aprovado.
5. Rotacionar segredos se houver suspeita de exposição e revogar sessões administrativas.

## Parâmetros definidos na implantação

O Compose permite que o GEATI defina no momento da implantação: domínio final, proxy, capacidade, política de egress, provedor de tiles, uso do Azure, backup/RPO/RTO, observabilidade, retenção de logs e responsáveis por contas, atualizações e incidentes. SMTP não é necessário no fluxo atual.
