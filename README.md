# Vem Pra EJA — versão web

Aplicação web responsiva do Vem Pra EJA, desenvolvida com Next.js e React.
Ela substitui a versão anterior em Flutter e permite escolher o nível de
ensino, encontrar escolas no mapa, consultar turnos e realizar a pré-inscrição.

## Tecnologias

- Next.js 16 e React 19
- Supabase para escolas, turnos e pré-inscrições
- Azure Speech por Azure Function para leitura assistida
- VLibras e modo de alto contraste
- Firebase Hosting para publicação estática

## Executar localmente

```bash
npm install
npm run dev
```

Crie um arquivo `.env.local` com as chaves públicas do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Produção

```bash
npm run build
npx firebase-tools deploy --only hosting
```

As credenciais privadas do Azure ficam somente nas Variáveis de ambiente da
Function App; não devem ser adicionadas ao repositório.
