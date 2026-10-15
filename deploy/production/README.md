# Vem Pra EJA — implantação na Prefeitura

Este diretório contém a implantação de produção do Vem Pra EJA para
`https://vempraeja.bc.sc.gov.br`.

A base do Supabase foi copiada da distribuição oficial
`self-hosted/v0.8.2`. O ambiente local criado pelo Supabase CLI não é exposto
em produção.

## Arquitetura

- Caddy publica somente as portas 80 e 443, emite e renova o certificado HTTPS.
- Nginx serve a exportação estática do Next.js.
- Supabase self-hosted executa PostgreSQL, Auth, REST, Realtime, Storage e Edge Functions.
- As Edge Functions enviam e-mail pelo SMTP institucional e consultam devoluções por IMAP.
- O contêiner `email-bounce-scheduler` verifica devoluções a cada cinco minutos.
- O banco, o Studio e o gateway não publicam portas diretamente no servidor.

## Requisitos do servidor

- Linux com Docker Engine e Docker Compose v2.
- Git, OpenSSL, curl e jq.
- DNS de `vempraeja.bc.sc.gov.br` apontando para o servidor.
- Portas de entrada 80/TCP e 443/TCP+UDP.
- Saída 587/TCP para SMTP, 993/TCP para IMAP e 443/TCP para Azure/VLibras/serviços externos.
- No mínimo 4 GB de RAM, 2 CPUs e 40 GB SSD; para produção, 8 GB de RAM,
  4 CPUs e 80 GB SSD são a referência recomendada pelo Supabase.
- Backup externo ao próprio servidor.

Documentação oficial:
https://supabase.com/docs/guides/self-hosting/docker

## Primeira instalação

Clone esta versão do repositório no servidor e entre nesta pasta:

```bash
cd deploy/production/supabase
```

Prepare os segredos. O comando gera chaves exclusivas e solicita a senha do
e-mail sem exibi-la:

```bash
sh scripts/prepare.sh
```

Revise os arquivos `.env` e `.env.functions`. Eles não podem ser enviados ao
Git, colocados em chamados ou compartilhados em capturas de tela.

Depois que o DNS estiver apontado e as portas 80/443 estiverem liberadas:

```bash
sh scripts/start.sh
```

Crie o primeiro administrador:

```bash
sh scripts/configure-admin.sh edson.tavares@bc.sc.gov.br
```

O cadastro público de usuários fica desativado em produção. Na regra atual,
toda conta criada manualmente no Supabase Auth é administrativa; portanto,
somente a equipe autorizada pode criar usuários e `DISABLE_SIGNUP=true` deve
permanecer habilitado.

Confira os serviços e o HTTPS:

```bash
sh scripts/status.sh
```

## Dados iniciais

As migrações criam todo o esquema e as políticas de segurança, mas as oito
inscrições existentes no computador de desenvolvimento não são copiadas para
produção. Isso evita transportar CPFs, telefones e dados de teste.

Antes da inauguração, cadastre ou importe apenas escolas, turnos e benefícios
já revisados. Confirme especialmente o e-mail institucional de cada escola.

## Operação

Status:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f --tail=200
docker compose logs -f functions
docker compose logs -f email-bounce-scheduler
```

Atualizar o código:

```bash
git pull
sh scripts/migrate.sh
docker compose up -d --build --wait
```

Backup manual:

```bash
sh scripts/backup.sh
```

O diretório `backups` deve ser copiado para armazenamento externo protegido.
A equipe de infraestrutura deve agendar esse script e testar periodicamente a
restauração.

Parar sem apagar dados:

```bash
sh run.sh stop
```

Nunca execute `reset.sh` em produção: esse comando remove o banco e os
arquivos persistidos.

## Azure Speech

O site já é construído com a URL atual da Azure Function. O domínio pode ser
autorizado antes mesmo de o DNS entrar no ar. Na Function App, a variável
`ALLOWED_ORIGINS` deve incluir:

```text
https://vempraeja.bc.sc.gov.br
```

Depois da alteração, reinicie a Function App e teste a leitura de voz pelo novo
domínio.

## Segurança e LGPD

- Somente a chave pública do Supabase entra no JavaScript do navegador.
- A service role, a senha do banco e as credenciais SMTP/IMAP ficam no servidor.
- O PostgreSQL e o Supabase Studio não são publicados na Internet.
- Novos cadastros públicos são validados por RLS.
- A função de e-mail aceita somente inscrições existentes e com envio pendente.
- O painel exige uma conta criada manualmente no Supabase Auth, com o cadastro
  público de usuários permanentemente desativado.
- Logs, backups e retenção de inscrições devem seguir a política da Prefeitura.
