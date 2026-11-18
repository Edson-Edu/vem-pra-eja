# VemPraEJA — implantação institucional no GEATI

O VemPraEJA ajuda jovens e adultos a encontrar escolas de EJA em Camboriú e Balneário Camboriú, comparar níveis e turnos, consultar o mapa e falar diretamente com a instituição escolhida.

Esta versão não realiza pré-inscrição e não coleta nome, CPF, e-mail, telefone, endereço ou mensagens dos visitantes. O último passo abre o WhatsApp oficial da escola com um texto inicial preenchido; a conversa e a eventual matrícula acontecem fora da plataforma.

## Arquitetura

```text
Navegador ──HTTPS──> proxy institucional ──HTTP──> app Next.js :3000
                                                    │
                                                    ├── API integrada e autenticação
                                                    └── PostgreSQL :5432 (rede Docker interna)
Navegador ─────────────────────────────────────────────> WhatsApp / OpenStreetMap
```

- Next.js 16.4.6, React 19 e TypeScript: interface pública, painel e API.
- PostgreSQL 17: escolas, turnos, auxílios, contas administrativas, sessões e métricas agregadas.
- Leaflet instalado no projeto: mapa interativo, sem JavaScript/CSS de CDN.
- Docker Compose: `app`, `db` e o serviço efêmero `migrate`.
- Volume `postgres_data`: persistência independente dos contêineres.

O frontend nunca acessa o PostgreSQL diretamente. Operações administrativas passam pela API, que valida sessão, CSRF, autorização e dados de entrada. A árvore `supabase/` foi mantida apenas como legado para auditoria e migração; ela não participa da nova execução Docker.

Mais detalhes: [arquitetura](docs/ARQUITETURA.md), [fluxo de dados](docs/FLUXO-DE-DADOS.md) e [manual do GEATI](docs/IMPLANTACAO-GEATI.md).

## Requisitos

- Docker Engine 24+ e Docker Compose v2.
- Proxy reverso institucional com domínio e certificado HTTPS.
- Espaço persistente para o volume PostgreSQL e para backups externos ao host.
- Acesso de saída dos navegadores ao provedor de mapas e ao WhatsApp.
- Node.js 24 apenas para desenvolvimento fora do Docker.

CPU, memória, domínio, política de backup, retenção de logs e janela de manutenção devem ser confirmados pelo GEATI antes da produção. Como ponto inicial para homologação, reservar 2 vCPU, 2 GB de RAM e 10 GB persistentes, medindo o consumo real antes de fixar limites.

## Instalação com Docker

1. Copie `.env.example` para `.env` e substitua todos os valores de exemplo. Gere segredos independentes, por exemplo com `openssl rand -base64 48`.
2. Defina `APP_ORIGIN` com a origem HTTPS final, sem barra no fim.
3. Suba a aplicação:

```bash
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

O serviço `migrate` cria o papel de privilégio mínimo e aplica apenas migrations ainda não registradas. Ele não derruba, recria nem limpa o banco. O PostgreSQL não publica porta no host; a aplicação escuta somente em `127.0.0.1:${APP_PORT:-3000}` para uso pelo proxy reverso.

### Primeira conta administrativa

Após as migrations:

```bash
docker compose run --rm migrate npm run admin -- create admin@instituicao.br
```

A senha é lida sem aparecer no terminal, deve ter ao menos 12 caracteres e é armazenada com bcrypt, custo 12. Não existe senha padrão. Para redefinir ou desativar:

```bash
docker compose run --rm migrate npm run admin -- reset admin@instituicao.br
docker compose run --rm migrate npm run admin -- deactivate admin@instituicao.br
```

O painel permanece deliberadamente bloqueado abaixo de 768 px.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---:|---|
| `MIGRATION_DB_PASSWORD` | sim | conta proprietária, usada somente por migrations/rotinas operacionais |
| `APP_DB_PASSWORD` | sim | conta de privilégio mínimo usada pelo app |
| `APP_ORIGIN` | sim | validação de Origin/CSRF, por exemplo `https://eja.exemplo.edu.br` |
| `RATE_LIMIT_SECRET` | sim | pseudonimização temporária em memória para limitar APIs públicas |
| `LOGIN_RATE_LIMIT_SECRET` | sim | chave separada para limitar tentativas de login |
| `TRUST_PROXY` | sim em proxy confiável | aceita o primeiro `X-Forwarded-For`; não habilite sem proxy que substitua esse cabeçalho |
| `NEXT_PUBLIC_MAP_TILE_URL` | não | provedor de tiles no build; confirme termos e atribuição antes de alterar |
| `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` | não | voz neural; sem elas o navegador usa síntese local como fallback |

Não versionar `.env`, dumps, chaves, tokens ou dados exportados. Variáveis `NEXT_PUBLIC_*` são incorporadas no build e, portanto, nunca devem conter segredo.

## Banco e migrations

As migrations ficam em `database/migrations/` e são registradas em `schema_migrations`. Para aplicá-las manualmente:

```bash
docker compose run --rm migrate
```

Alterações do painel são transacionais e permanecem no volume. Não edite JSON nem faça novo deploy para cadastrar uma escola.

### Migração das escolas do Supabase legado

Faça primeiro em homologação e mantenha backup da origem:

```bash
SOURCE_DATABASE_URL='postgresql://...' node scripts/exportar-supabase.mjs
docker compose run --rm -v "$PWD/migration-data:/app/migration-data:ro" migrate \
  node scripts/importar-escolas.mjs migration-data/escolas-AAAA-MM-DD.json
```

O exportador lê somente escolas, turnos e auxílios. Tabelas de inscrições não são exportadas. O importador preserva UUIDs, executa em uma transação e usa provisoriamente `5547984400475` quando a origem não possui WhatsApp válido. Revise esses números no painel antes da publicação.

## Backup, restauração e atualização

```bash
./scripts/geati/backup.sh /caminho/fora-do-repositorio
CONFIRM_RESTORE=SIM ./scripts/geati/restore.sh /caminho/backup.dump
./scripts/geati/update.sh
```

O script de atualização cria backup antes do build, executa migrations e só então recria o app. A restauração é destrutiva para o banco de destino e exige confirmação explícita; teste-a periodicamente em homologação. Cópias devem ficar fora do volume e seguir criptografia, retenção e controle de acesso institucionais.

## Proxy e HTTPS

O GEATI deve terminar TLS no proxy, encaminhar `Host`, `X-Forwarded-Proto` e substituir (não apenas acrescentar) `X-Forwarded-For`. Preserve streaming e os cabeçalhos de cache do Next.js. Um exemplo de Nginx está no [manual de implantação](docs/IMPLANTACAO-GEATI.md).

Não publique a porta 5432. Não exponha a porta 3000 além de loopback/rede do proxy.

## Segurança, privacidade e métricas

- Sessão administrativa em cookie `HttpOnly`, `Secure` em produção e `SameSite=Strict`.
- Token CSRF e validação de origem em todas as mutações administrativas.
- Senhas com bcrypt; queries parametrizadas; schemas Zod; rate limit de login persistido no banco.
- Métricas registram somente totais por dia/hora/evento/escola/nível/turno/página/dispositivo.
- Não há UUID de visitante, cookie analítico, perfil, mensagem ou IP no banco de métricas.
- `sessionStorage` é usado apenas para fluxo/acessibilidade e deduplicação temporária na aba.
- Logs do proxy e do Docker são responsabilidade operacional: minimizar campos, restringir acesso e definir retenção.

Um clique no WhatsApp é um encaminhamento, não prova conversa, matrícula ou vaga.

## OpenStreetMap

O padrão usa `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, atribuição visível, cache normal do navegador e sem prefetch/offline. A política oficial informa que o serviço é comunitário, sem SLA e pode bloquear uso inadequado: [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/). Para tráfego institucional relevante, o GEATI deve avaliar um provedor com contrato/SLA ou tiles próprios antes da produção.

## Desenvolvimento e verificação

```bash
npm ci
npm run lint
npm test
npm run build
```

Use PostgreSQL convencional também no desenvolvimento. O Supabase CLI só é necessário para consultar o legado durante a transição.

## Portas e integrações

| Origem | Destino | Necessidade |
|---|---|---|
| proxy institucional | app TCP 3000 | obrigatório, apenas rede local/loopback |
| app | db TCP 5432 | obrigatório, somente rede Docker `backend` |
| navegador | tiles HTTPS 443 | mapa; sujeito à política do provedor |
| navegador | `wa.me` HTTPS 443 | contato externo |
| app | Azure Speech HTTPS 443 | opcional |

## Pendências institucionais

Antes de publicar, o GEATI precisa confirmar domínio, certificados, limites de recursos, monitoramento, retenção de logs, frequência/guarda dos backups, credenciais do serviço de voz, provedor de mapa, responsáveis por atualização e procedimento de incidente. Nenhuma dessas decisões exige acesso de alunos ao servidor.
