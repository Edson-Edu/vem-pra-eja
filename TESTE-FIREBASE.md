# Teste de publicação solicitado em 27/08/2026

## Estado

TESTE PUBLICADO E VERIFICADO em 02/09/2026. Aguardando decisão do usuário.

### Teste atual: nomenclatura auxilios em 02/09/2026

- Versao atual: `b630e1b5fe3d1418`, lancamento `1788376841552000`, de `2026-09-02T19:20:41.552Z` (16:20 de Brasilia).
- Apenas textos: beneficios substituidos por auxilios na interface publica e administrativa, no pacote de audio e na extracao/agrupamento do VLibras. Nomes internos do banco e layouts preservados.
- Build e dez testes passaram, incluindo testes do texto enviado ao audio e do agrupamento de auxilios no VLibras. Sem nova validacao de reproducao remota de voz/sinais nesta rodada.
- Fonte: `.codex-backups/fonte-teste-auxilios-20260902.zip`, SHA-256 `F3AC5D5F289CD2CD6CE7DCF38610A068EE601EF96A372511DDC3F26C6665796A`.
- Build: `.codex-backups/build-teste-auxilios-20260902.zip`, SHA-256 `21166C245012C046DD473433AE8D21AC497A6A03C82CC9E2EBF9D79F84FF3844`.
- Os 196 arquivos e sete rotas foram verificados contra o build publicado. Relatorio: `.codex-backups/verificacao-auxilios-20260902.json`.
- Reserva original `5035a9d7ef5659de` integra e FINALIZED. Versao anterior `2bff919f353efd30` e todos os backups preservados. Somente Hosting publicado.

**PUBLICAR TESTE OFICIALMENTE / PUBLICAR OFICIALMENTE O TESTE:** verificar se `live` ainda e `b630e1b5fe3d1418` e registrar aprovacao dessa versao exata, sem rebuildar. **CANCELAR TESTE** continua restaurando a reserva original `5035a9d7ef5659de`.

### Historico: responsividade tablet em 02/09/2026

- Versao atual: `2bff919f353efd30`, lancamento `1788376442941000`, de `2026-09-02T19:14:02.941Z` (16:14 de Brasilia).
- Unica alteracao de interface: bloco CSS limitado a 768-1279 px. Nivel com area util maior, cartoes distribuidos verticalmente, tipografia legivel e lembrete no fim. Cadastro com botao proximo ao fim da pagina, no fluxo e sem sobrepor campos.
- Todo o CSS anterior foi comparado com a fonte publicada e permaneceu identico fora do novo bloco. Nenhuma alteracao nos componentes React.
- Teste visual isolado dos componentes reais, sem servicos externos: 18 capturas em nove tamanhos; imagens antes/depois identicas em 390, 767, 1280 e 1440 px. Tablets conferidos em 768x1024, 820x1180, 1024x768, 1024x1366 e 1279x900, sem overflow horizontal. Nao foi validada a navegacao integrada nesta rodada; o servidor estatico de testes ficou na abertura. Relatorio e capturas: `.codex-backups/tablet-20260902/`.
- Build e oito testes de acessibilidade passaram. Teste visual reproduzivel: `node tests/tablet-layout.cjs`, usando a copia da publicacao anterior em `.codex-backups/tablet-baseline-20260902/`.
- Fonte: `.codex-backups/fonte-teste-tablet-20260902.zip`, SHA-256 `2BDE4AE0A51FB27282B82B5904E2F170A754F7EE6A37A02A8E830646E8D1868B`.
- Build: `.codex-backups/build-teste-tablet-20260902.zip`, SHA-256 `A4A5647ABAF55F905B22097025F8EE34D8EF84E70B65EABDF5A0BAD6AE990B78`.
- Publicacao verificada por hashes dos 196 arquivos e HTTP 200 com conteudo identico ao build nas sete rotas. Relatorio: `.codex-backups/verificacao-tablet-20260902.json`.
- Reserva original `5035a9d7ef5659de` verificada, FINALIZED e 196 arquivos integros. Publicacao anterior `3c94c56722091e5b` e todos os backups preservados; hashes dos ZIPs anteriores reconferidos. Somente Hosting publicado.

Este teste foi substituido pela atualizacao de nomenclatura registrada acima. Seus arquivos permanecem preservados.

### Historico: interacao VLibras em 28/08/2026

- Versao atual: `3c94c56722091e5b`, lancamento `1787950860077000`, de `2026-08-28T21:01:00.077Z` (18:01 de Brasilia).
- Publicada a versao local validada: Interagir nos cartoes de nivel e turnos, descricao de Nunca estudei agrupada com o titulo e animacao de entrada do nivel restrita ao smartphone.
- Fonte: `.codex-backups/fonte-teste-vlibras-20260828.zip`, SHA-256 `0613239B37B25A08CD006CC2FF6EFB353DE51C5D58F602C139E981684A9CF446`.
- Build: `.codex-backups/build-teste-vlibras-20260828.zip`, SHA-256 `4B8AEE36DE30021A3ABBFFDED83D32E67ED4EE4BB49862F250C9D5E22CCCBC89`.
- Build passou; oito testes e lint do componente passaram. Interagir conferido em desktop, tablet e celular. A traducao em sinais nao foi validada integralmente devido a erro de conexao do servico VLibras durante o teste local.
- Os 196 arquivos publicados tiveram hashes conferidos e as sete rotas principais retornaram HTTP 200 com conteudo identico ao build. Relatorio: `.codex-backups/verificacao-vlibras-20260828.json`.
- Reserva original `5035a9d7ef5659de` novamente verificada, com 196 arquivos integros e status FINALIZED. Versao anterior `7fd59a3ca5029730` e todos os backups preservados; hashes dos ZIPs anteriores reconferidos. Somente Hosting publicado.

Este teste foi substituido pela correcao de tablet registrada acima. Seus arquivos permanecem preservados.

### Historico: acessibilidade desktop e tablet em 28/08/2026

- Versão atual: `7fd59a3ca5029730`, lançamento `1787947894921000`, de `2026-08-28T20:11:34.921Z` (17:11 de Brasília).
- Mesmo ícone, botão e padrão de painel em todos os tamanhos; painel inferior até 1279 px e centralizado no desktop. Pergunta de nível deslocada 24 px para baixo apenas no desktop, sem mover os cartões. Smartphone preservado.
- Fonte: `.codex-backups/fonte-teste-desktop-tablet-20260828.zip`, SHA-256 `9BCAC3E7EF5F2CE4D12750491B29414DDB105F199186629F4A3BDA13F5F35FB6`.
- Build exato validado: `.codex-backups/build-teste-desktop-tablet-20260828.zip`, SHA-256 `E33EDB9D77A6720B4D1F0CCFE9F29F1C5C7EDFBC9035D42E236828FFB7A71A49`.
- Build, lint e oito testes passaram antes da autorização de publicação. Conferência visual em desktop, tablet e smartphone concluída.
- Os 196 arquivos publicados e as sete páginas principais foram conferidos contra o build. Relatório: `.codex-backups/verificacao-desktop-tablet-20260828.json`.
- Reserva original `5035a9d7ef5659de` novamente verificada; versão anterior `fd6e3ec3b6000ee8` e todos os backups preservados, com hashes dos ZIPs anteriores reconferidos. Somente Hosting publicado.

Este teste foi substituido pela correcao de interacao VLibras registrada acima. Seus arquivos permanecem preservados.

### Histórico: áudio sem deslocamento dos cartões em 28/08/2026

- Versão atual: `fd6e3ec3b6000ee8`, lançamento `1787947174995000`, de `2026-08-28T19:59:34.995Z` (16:59 de Brasília).
- Removida somente a regra mobile que adicionava 48 px de padding superior aos cartões de nível com áudio ativo. Posições dos botões preservadas.
- Comparação local em 390 x 844 confirmou altura dos três cartões e posição dos títulos idênticas com áudio ligado e desligado.
- Fonte: `.codex-backups/fonte-teste-audio-espaco-20260828.zip`, SHA-256 `574DC18627A5A9DC0C9A21BA63E0A29DCE6F2FBACD3290930363092C8101B2F5`.
- Build: `.codex-backups/build-teste-audio-espaco-20260828.zip`, SHA-256 `56B9BDB425A754790F7F2F7B04135084CA87579CAA1F1F98E49D9AE07DD60545`.
- Build e oito testes passaram; 196 arquivos publicados e sete rotas HTTP conferidos. Relatório: `.codex-backups/verificacao-audio-espaco-20260828.json`.
- Backup original `5035a9d7ef5659de` e todos os anteriores preservados; ZIPs da versão anterior `77b5605091dbb27c` reconferidos. Somente Hosting publicado.

Este teste foi substituído pela atualização desktop e tablet registrada acima. Seus arquivos permanecem preservados.

### Histórico: painel de acessibilidade smartphone em 28/08/2026

- Versão atual: `77b5605091dbb27c`, lançamento `1787946589440000`, de `2026-08-28T19:49:49.440Z` (16:49 de Brasília).
- Painel smartphone compacto conforme referência: contraste separado, Libras e leitura agrupados, switches à direita e retorno no rodapé. Ícones existentes e funcionamento preservados; desktop mantém a apresentação anterior.
- Fonte: `.codex-backups/fonte-teste-painel-20260828.zip`, SHA-256 `3AD6EF16173FD2E52181971E459D9495DCD9C45DA24170F6F9A104852B583B7F`.
- Build exato: `.codex-backups/build-teste-painel-20260828.zip`, SHA-256 `C5152C3322FA6B98FB5B48FC7FCEA2FD9CCCA0FECF8C0F2BC3652C662F27C991`.
- Build, oito testes e lint do componente passaram. Conferido em 390 x 844 e 320 x 568, incluindo alto contraste e retorno; estilos desktop conferidos em 1366 x 900.
- Os 196 arquivos publicados e as sete rotas principais foram verificados contra o build. Relatório: `.codex-backups/verificacao-painel-20260828.json`.
- Reserva original `5035a9d7ef5659de` íntegra e disponível; versão anterior `2ea12403e186b810` e seus ZIPs preservados e reconferidos por SHA-256.
- Somente Hosting publicado; nenhum banco de dados ou serviço de voz foi alterado.

Este teste foi substituído pela correção de espaçamento de áudio registrada acima. Seus arquivos permanecem preservados.

### Histórico: correções de mapa e acessibilidade em 28/08/2026

- Versão atual: `2ea12403e186b810`, lançamento `1787935880309000`, de `2026-08-28T16:51:20.309Z` (13:51 de Brasília).
- Botão de acessibilidade removido da abertura; nas demais telas smartphone o estilo transparente não depende mais da presença do cabeçalho durante o carregamento.
- Removidos o afastamento artificial dos pinos do mapa, as linhas de ligação e o utilitário correspondente. As coordenadas das escolas permanecem inalteradas.
- Fonte arquivada: `.codex-backups/fonte-teste-correcoes-mapa-20260828.zip`, SHA-256 `888616EE091DDA4326FD9D87728EB692170786F6DA617C43CD4F0D24B7BD0FD8`.
- Build exato: `.codex-backups/build-teste-correcoes-mapa-20260828.zip`, SHA-256 `947BBA334AB6D4D0581978DF2EB6D65151B69E275E334D1F466E0F41896C6438`.
- Build e oito testes passaram. Lint sem erros, com cinco avisos de dependências de hooks no mapa. Conferência local da abertura, dos pinos sem linhas e do botão na navegação.
- Publicação verificada: hashes dos 196 arquivos e HTTP 200 com conteúdo idêntico ao build nas sete rotas principais. Relatório: `.codex-backups/verificacao-correcoes-mapa-20260828.json`.
- Reserva original `5035a9d7ef5659de` novamente verificada, com 196 arquivos íntegros. Teste anterior `2ead0b39f6483ba9` e seus arquivos continuam preservados.
- Somente Hosting publicado; nenhum dado, banco, serviço de voz ou Functions foi alterado.

Este teste foi substituído pelo painel de acessibilidade registrado acima. Seus arquivos permanecem preservados.

### Histórico: atualização do cabeçalho smartphone em 28/08/2026

Publicação autorizada pelo usuário, mantendo a reserva original e os testes anteriores. Somente o cabeçalho abaixo de 768 px foi ajustado; desktop preservado.

- URL: https://vempraeja-novo.web.app
- Versão atual do teste: `2ead0b39f6483ba9`.
- Lançamento: `1787935361269000`, de `2026-08-28T16:42:41.269Z` (13:42 de Brasília).
- Fonte: base Git `a23ed03` com as alterações de `app/globals.css` e `app/components/IndicadorProgresso.tsx`, preservada em `.codex-backups/fonte-teste-cabecalho-20260828.zip`.
- SHA-256 da fonte: `0F6B0D9066785A9EC9513C84E81F2A6A7178EB0AD5D74C8D7BA0208F62AE603B`.
- Build exato: `.codex-backups/build-teste-cabecalho-20260828.zip`.
- SHA-256 do build: `C5876C5C22CFFF1EF55E76CF695F983B03FB312EB254E2C486C5E2EA66D2C8EA`.
- Build e oito testes passaram. Os 196 arquivos publicados tiveram hashes conferidos; as sete rotas principais retornaram HTTP 200 com conteúdo idêntico ao build.
- Relatório: `.codex-backups/verificacao-cabecalho-20260828.json`.
- Os 196 arquivos da reserva original foram novamente verificados. A versão `5035a9d7ef5659de` continua disponível no Hosting e nos backups locais.
- O teste imediatamente anterior `948c95ec0c9d9054`, sua fonte e seu build continuam preservados. Seus arquivos ZIP tiveram os hashes reconferidos antes desta publicação.
- Publicado somente Hosting. Nenhuma alteração de banco, Functions, Azure ou publicação no GitHub.

Este teste foi substituído pelas correções de mapa e acessibilidade registradas acima. Seus arquivos permanecem preservados.

### Atualização do teste autorizada em 27/08/2026

O usuário solicitou publicar a revisão de UI/acessibilidade validada no localhost. A publicação foi concluída e verificada em `2026-08-27T19:43:21.370Z` (16:43 de Brasília). Substituiu somente o teste, não a reserva original `5035a9d7ef5659de`. Build e oito testes passaram. Fonte e build foram preservados separadamente.

Os comandos **PUBLICAR TESTE OFICIALMENTE** e **PUBLICAR OFICIALMENTE O TESTE** têm o mesmo significado: aprovar a última versão de teste publicada e registrada neste documento, sem incorporar alterações locais posteriores. **CANCELAR TESTE** continua apontando para `5035a9d7ef5659de`.

## Histórico: teste de 27/08/2026 (substituído)

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

Esta versão foi substituída pelo teste de cabeçalho de 28/08/2026 registrado acima. Seus arquivos continuam preservados para retorno específico a este teste intermediário.

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

## Atualização de 10/09/2026 — bloqueio de níveis sem escolas

- Publicada no Hosting de https://vempraeja-novo.web.app a versão compilada nesta data. A publicação anterior ainda era de 02/09/2026 e não continha a mudança local; essa foi a causa do problema relatado.
- Build de produção e 15 testes passaram. O JavaScript público passou de `3mprwgdr9q-ex.js` (sem bloqueio) para `1lz5m3v09gbr-.js` (com `data-nivel-indisponivel`).
- Verificação no navegador, com os dados atuais: Nunca estudei e Ensino Fundamental apagados; clique em ambos abre o aviso e mantém /nivel/. Ensino Médio disponível. Aviso inferior conferido na largura de 661 px.
- Backups: `.codex-backups/build-nivel-disponibilidade-20260910.zip` e `.codex-backups/fonte-nivel-disponibilidade-20260910.zip`. Backups anteriores preservados.
- Somente Hosting publicado. Esta atualização substitui a versão corrente de setembro indicada no histórico acima; não usar o ID antigo como se ainda fosse a publicação atual.
