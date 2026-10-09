# Vem Pra EJA — versão web

Aplicação web responsiva do Vem Pra EJA, desenvolvida com Next.js 16 e React 19.
Ela permite escolher o nível de ensino, localizar escolas, consultar turnos e
realizar a pré-inscrição.

## Componentes

- Next.js com exportação estática.
- Supabase/PostgreSQL para escolas, turnos, inscrições, autenticação e métricas.
- Edge Functions para e-mail institucional e tratamento de devoluções.
- Azure Speech para leitura assistida.
- VLibras e modo de alto contraste.

## Desenvolvimento local

Abra o Docker Desktop e, no Ubuntu/WSL, execute:

```bash
cd ~/projetos/vem-pra-eja
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 24
npx supabase start
npm run dev
```

Site: http://localhost:3000

Painel: http://localhost:3000/admin

Supabase Studio local: http://localhost:54323

Para desligar:

```bash
# Ctrl+C encerra o Next.js
npx supabase stop
```

As variáveis públicas do desenvolvimento ficam em `.env.development.local`.
As credenciais SMTP/IMAP locais ficam em `supabase/functions/.env`. Esses
arquivos não devem ser enviados ao Git.

## Verificação

```bash
npm run check
```

O comando executa lint, testes e o build estático.

## Produção na Prefeitura

A produção não usa o ambiente do Supabase CLI nem o Firebase antigo. Ela possui
um pacote Docker Compose separado e fixado no Supabase self-hosted oficial.

Leia o manual completo em:

`deploy/production/README.md`

Domínio planejado: https://vempraeja.bc.sc.gov.br
