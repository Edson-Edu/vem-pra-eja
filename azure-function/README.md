# Função de voz do VemPraEJA

Esta função fica entre o site e o Azure Speech. A chave `AZURE_SPEECH_KEY` deve existir **somente** nas configurações da Function App; nunca no repositório nem em variáveis `NEXT_PUBLIC_*`.

## Configurações da Function App

Defina as configurações de aplicativo:

- `AZURE_SPEECH_KEY`: chave do serviço Azure Speech já existente.
- `AZURE_SPEECH_REGION`: `centralus`.
- `ALLOWED_ORIGINS`: `https://vempraeja-novo.web.app,https://vempraeja-novo.firebaseapp.com` (acrescente `http://localhost:3000` enquanto desenvolve).

Após publicar a função, copie a URL pública terminada em `/api/voz` para `AZURE_VOICE_FUNCTION_URL` no ambiente de build do site. Essa URL se torna `NEXT_PUBLIC_AZURE_VOICE_FUNCTION_URL`; ela não contém a chave do Azure.
