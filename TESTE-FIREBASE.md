# Teste de publicação solicitado em 27/08/2026

## Estado

RESERVA CONCLUÍDA; publicação de teste ainda pendente.

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

## Retorno exato autorizado por CANCELAR TESTE

Antes de executar, confirmar que não existe uma publicação posterior independente do teste.

```powershell
npx --yes firebase-tools hosting:clone vempraeja-novo@5035a9d7ef5659de vempraeja-novo:live --project vempraeja-novo --non-interactive
```

Esse comando troca apenas o Hosting, sem apagar o código do teste nem alterar dados. Se a versão não estiver mais disponível no Firebase, republicar o backup verificado com a configuração original de Hosting; não incluir os endpoints reservados `__/firebase` na republicação manual.

## Comandos combinados com o usuário

- **CANCELAR TESTE**: restaurar a versão que estava publicada antes deste teste. Não descartar as alterações do teste nem reverter arquivos de forma ampla. Usar a versão exata de Hosting previamente registrada e preservar ambos os códigos.
- **PUBLICAR OFICIALMENTE O TESTE**: promover/confirmar a versão exata testada, sem incorporar alterações posteriores silenciosamente.

## Pré-requisitos para iniciar o teste

1. Consultar a versão e o lançamento atuais do canal `live`.
2. Preservar os arquivos publicados e identificar/preservar o código correspondente. Firebase Hosting publica arquivos compilados, não constitui backup do código-fonte React.
3. Registrar IDs, backups, fontes e procedimento de restauração verificado neste documento.
4. Salvar separadamente o código e o build de teste; executar build com sucesso.
5. Publicar apenas Hosting, no site existente autorizado pelo usuário. Não modificar Supabase, Analytics, Azure ou dados de inscrições.
6. Registrar a versão de teste e verificar a publicação.

Um canal de preview pode expirar; não usá-lo como única cópia permanente da versão anterior.
