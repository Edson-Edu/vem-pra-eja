# Função de voz do Vem Pra EJA

Esta função fica entre o site e o Azure Speech. A chave
`AZURE_SPEECH_KEY` deve existir somente nas configurações da Function App;
nunca no repositório nem em variáveis `NEXT_PUBLIC_*`.

## Configurações da Function App

Defina:

- `AZURE_SPEECH_KEY`: chave do serviço Azure Speech.
- `AZURE_SPEECH_REGION`: `centralus`.
- `ALLOWED_ORIGINS`: lista separada por vírgulas. Inclua
  `https://vempraeja.bc.sc.gov.br` e `http://localhost:3000` durante o desenvolvimento.

A URL pública terminada em `/api/voz` deve ser informada como
`AZURE_VOICE_FUNCTION_URL` durante o build do site. A URL não contém a chave
do Azure.

O domínio pode ser incluído em `ALLOWED_ORIGINS` antes de o DNS ser ativado.
