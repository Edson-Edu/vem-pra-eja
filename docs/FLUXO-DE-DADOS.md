# Fluxo de dados e privacidade

## Visitante

1. A pessoa escolhe o nível de ensino.
2. O navegador consulta escolas ativas pela API do VemPraEJA.
3. O mapa exibe localização e informações institucionais.
4. A pessoa escolhe escola e turno.
5. O navegador monta um link `https://wa.me/` com o número oficial da escola e uma mensagem contextual.
6. Se não houver WhatsApp escolar válido, a interface informa isso e oferece, sem redirecionamento silencioso, o contato geral de contingência `5547989074653`.
7. O WhatsApp é aberto fora do VemPraEJA.

O site não solicita nem grava nome, CPF, idade, telefone, e-mail, endereço, conteúdo da conversa ou resultado da matrícula. O número do visitante não é conhecido pela plataforma.

```text
escolha local ──> consulta de escolas ──> detalhe ──> link wa.me
                                                       │
                                                       └── conversa externa
```

## Dados que permanecem

| Categoria | Exemplos | Finalidade | Retenção |
|---|---|---|---|
| escolas | nome, endereço, coordenadas, WhatsApp, turnos e auxílios | informação pública e contato | enquanto a instituição estiver cadastrada |
| administradores | e-mail institucional e hash de senha | manutenção autorizada | até desativação/exclusão definida pelo responsável |
| sessões | hash do token, CSRF, expiração | autenticação | 8 horas; registros antigos são limpos progressivamente |
| métricas agregadas | total por evento/dia/hora/escola/nível/turno | avaliação do serviço | definir prazo institucional |
| logs técnicos | requisições/erros conforme proxy e Docker | operação e segurança | definir minimização e prazo institucional |

## Métricas

Eventos permitidos: visita, seleção de nível, visualização do mapa, visualização da escola, chegada ao contato e clique no WhatsApp. A tabela armazena contadores agregados. Não existe ID de visitante, fingerprint, cookie analítico ou IP nessa tabela.

O endereço de rede pode ser processado momentaneamente em memória para rate limit e, no login, transformado com HMAC antes de compor a chave de limite. A aplicação não grava o IP em claro. O proxy pode gerar logs próprios, que devem ser configurados e governados pelo GEATI.

As estatísticas não podem ser apresentadas como pessoas únicas. “Clique no WhatsApp” significa somente que o link foi acionado; a plataforma não sabe se houve conversa, vaga ou matrícula.

## Terceiros

- WhatsApp recebe a navegação somente após ação explícita do visitante e aplica seus próprios termos/política.
- O provedor de tiles recebe requisições técnicas do navegador. Não enviar dados pessoais na URL.
- Azure Speech é opcional e recebe apenas o texto público solicitado para síntese; desabilite-o se a política institucional não aprovar esse processamento.

## Legado

As tabelas e funções antigas de pré-inscrição permanecem apenas na pasta histórica `supabase/`. Elas não são construídas nem chamadas pelo Docker GEATI, e nenhum dado do banco antigo é importado. Exclusão definitiva de dados pessoais legados depende de autorização, política de retenção e backup separados; não é executada automaticamente por este projeto.
