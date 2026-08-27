# Teste de publicação solicitado em 27/08/2026

## Estado

TESTE PUBLICADO E VERIFICADO em 27/08/2026. Aguardando decisão do usuário.

### Atualização do teste autorizada em 27/08/2026

O usuário solicitou publicar a revisão de UI/acessibilidade validada no localhost. A publicação foi concluída e verificada em `2026-08-27T19:43:21.370Z` (16:43 de Brasília). Substituiu somente o teste, não a reserva original `5035a9d7ef5659de`. Build e oito testes passaram. Fonte e build foram preservados separadamente.

Os comandos **PUBLICAR TESTE OFICIALMENTE** e **PUBLICAR OFICIALMENTE O TESTE** têm o mesmo significado: aprovar a última versão de teste publicada e registrada neste documento, sem incorporar alterações locais posteriores. **CANCELAR TESTE** continua apontando para `5035a9d7ef5659de`.

## Teste em avaliação

- URL pública: https://vempraeja-novo.web.app
- Código do teste: `1faf15a`.
- Versão Hosting do teste: `948c95ec0c9d9054`.
- Lançamento: `1787859801370000`, de `2026-08-27T19:43:21.370Z`.
- Código arquivado: `.codex-backups/fonte-teste-1faf15a.zip`.
- Build exato arquivado: `.codex-backups/build-teste-1faf15a.zip`.
- SHA-256 da fonte arquivada: `B0AEC6BEE58DE38F374FE661B8F091183E5A4A6E938ED32A0EE332DDBE4257BC`.
- SHA-256 do build arquivado: `862A4D7F4E758B0276B7E4CAFC8453261E2E113EF89777B69FA830B0F0D9156B`.
- Reserva original compactada: `.codex-backups/publicacao-original-5035a9d7ef5659de.zip`.
- Build passou; os 196 arquivos publicados tiveram hashes conferidos contra o build validado. `/`, `/nivel/`, `/escolas/`, `/detalhes/`, `/cadastro/`, `/sucesso/` e `/admin/` retornaram HTTP 200 e conteúdo idêntico ao build local.
- Relatório de verificação: `.codex-backups/verificacao-teste-1faf15a.json`.
- Nenhuma publicação no GitHub, alteração de banco ou implantação de Functions foi feita.

**PUBLICAR TESTE OFICIALMENTE / PUBLICAR OFICIALMENTE O TESTE:** verificar se `live` ainda é `948c95ec0c9d9054`; se sim, a versão já está no link principal e basta registrar sua aprovação como oficial, preservando a reserva. Se a versão estiver em outro canal, promover a versão exata. Não rebuildar ou incorporar mudanças novas sem pedido do usuário.

### Teste anterior também preservado (não é a reserva de cancelamento)

O teste anterior usava código `05f500f`, versão `945fefb2396eb0b2` e lançamento `1787850086931000` de `2026-08-27T17:01:26.931Z`. Seus arquivos `.codex-backups/fonte-teste-05f500f.zip` e `.codex-backups/build-teste-05f500f.zip` continuam intactos. **CANCELAR TESTE não retorna a esse teste intermediário; retorna sempre à reserva original `5035a9d7ef5659de`.**

Projeto Firebase configurado: `vempraeja-novo`.
Base Git local: `a5e44795673de1ae9c3ea174f82b26aaffa1d47c`.
Cópia dessa base: `.codex-backups/fonte-base-a5e4479-antes-teste.zip`.
Essa é a base histórica do código anterior aos ajustes de interface. Uma recompilação em outro diretório não reproduziu todos os hashes do build original; portanto, para um retorno EXATO usar a versão de Hosting ou o backup dos arquivos publicados, não recompilar a base presumindo identidade binária.
Histórico completo do Git preservado e verificado: `.codex-backups/historico-antes-teste-20260827.bundle`.

## Reserva verificada

- Versão original: `5035a9d7ef5659de`.
- Lançamento original: `1787763653816000`, de `2026-08-26T17:00:53.816Z`.
- Canal principal consultado tinha retenção de `2147483647` lançamentos.
- Cópia exata criada em `reserva-antes-teste-20260827` no mesmo site.
- Backup local: `.codex-backups/firebase-live-5035a9d7ef5659de/`.
- Manifesto oficial: `.codex-backups/firebase-original-files.json`.
- Manifesto de verificação: `.codex-backups/firebase-live-5035a9d7ef5659de-manifest.json`.
- Os 196 arquivos publicados pelo projeto tiveram hashes gzip SHA-256 conferidos contra a API Firebase. Os dois endpoints `__/firebase/init.js` e `__/firebase/init.json` são gerados pelo serviço; sua resposta atual foi guardada mas não é uma cópia binária da versão histórica.
- O canal de reserva é temporário; o histórico live e os backups locais não dependem da duração desse canal.
- Expiração do canal de reserva: `2026-09-03T16:55:42.480559372Z`. A restauração por ID usa o histórico do canal live, não depende desse preview.

## Retorno exato autorizado por CANCELAR TESTE

Antes de executar, confirmar que não existe uma publicação posterior independente do teste.

```powershell
npx --yes firebase-tools hosting:clone vempraeja-novo@5035a9d7ef5659de vempraeja-novo:live --project vempraeja-novo --non-interactive
```

Esse comando troca apenas o Hosting, sem apagar o código do teste nem alterar dados. Se a versão não estiver mais disponível no Firebase, republicar o backup verificado com a configuração original de Hosting; não incluir os endpoints reservados `__/firebase` na republicação manual.

## Comandos combinados com o usuário

- **CANCELAR TESTE**: restaurar a versão que estava publicada antes deste teste. Não descartar as alterações do teste nem reverter arquivos de forma ampla. Usar a versão exata de Hosting previamente registrada e preservar ambos os códigos.
- **PUBLICAR TESTE OFICIALMENTE** ou **PUBLICAR OFICIALMENTE O TESTE**: promover/confirmar a versão exata testada, sem incorporar alterações posteriores silenciosamente.

## Pré-requisitos para iniciar o teste

1. Consultar a versão e o lançamento atuais do canal `live`.
2. Preservar os arquivos publicados e identificar/preservar o código correspondente. Firebase Hosting publica arquivos compilados, não constitui backup do código-fonte React.
3. Registrar IDs, backups, fontes e procedimento de restauração verificado neste documento.
4. Salvar separadamente o código e o build de teste; executar build com sucesso.
5. Publicar apenas Hosting, no site existente autorizado pelo usuário. Não modificar Supabase, Analytics, Azure ou dados de inscrições.
6. Registrar a versão de teste e verificar a publicação.

Um canal de preview pode expirar; não usá-lo como única cópia permanente da versão anterior.
