# Testes locais com Docker

Este roteiro cria um PostgreSQL novo e isolado no volume Docker do projeto. Ele não acessa nem importa o Supabase antigo.

## 1. Pré-requisitos

- Docker Desktop com integração WSL ou Docker Engine com Compose v2.
- Portas locais 3000 livres.
- Navegador atualizado.

Confirme:

```bash
docker version
docker compose version
```

## 2. Configurar o ambiente

Na raiz do projeto:

```bash
cp .env.example .env
openssl rand -hex 32
```

Edite `.env`. Substitua todas as senhas e chaves de exemplo por valores aleatórios independentes e, para o teste local, use:

```dotenv
APP_ORIGIN=http://localhost:3000
APP_PORT=3000
TRUST_PROXY=false
```

Não envie `.env` ao Git. `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION` podem ficar vazias; nesse caso, a leitura em voz alta usa a síntese disponível no navegador.

## 3. Iniciar banco e aplicação

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 migrate app db
curl --fail http://localhost:3000/api/health
```

Endereços:

- Site público: `http://localhost:3000`
- Painel administrativo: `http://localhost:3000/admin`

Antes do primeiro cadastro, o site deve informar que ainda não há escolas disponíveis. Isso é esperado.

## 4. Criar o primeiro administrador

```bash
docker compose run --rm migrate npm run admin -- create seu-email@instituicao.br
```

Digite uma senha com pelo menos 12 caracteres quando solicitado. Ela não aparece na tela e não é gravada em arquivos do repositório. Depois, abra `/admin` em um computador ou janela com largura mínima de 768 px.

## 5. Roteiro funcional

1. Entre no painel.
2. Crie os auxílios necessários durante o cadastro do primeiro turno.
3. Cadastre uma escola de teste com coordenadas próximas a Camboriú, nível, turno e horários.
4. Teste uma vez com WhatsApp oficial preenchido e confirme, sem enviar a mensagem, o número e o texto aberto pelo `wa.me`.
5. Edite a escola, deixe o WhatsApp vazio e confirme que o site mostra claramente o contato geral `5547989074653` como contingência, nunca como número oficial da escola.
6. Altere nome, turno ou auxílio e confirme a atualização no site público.
7. Desative e reative a escola; confirme a visibilidade pública.
8. Exclua a escola usando a confirmação exigida pelo painel e confirme o retorno ao estado vazio.

Os registros desse roteiro ficam somente no banco local. Não use nomes ou contatos de pessoas reais em dados de teste.

## 6. Métricas e retrospectiva

Depois de cadastrar uma escola:

1. Acesse a página inicial, selecione um nível e abra o mapa.
2. Abra a escola, selecione um turno e clique no WhatsApp.
3. Volte ao painel, abra **Estatísticas de Acesso** e confira resumo, acessos e encaminhamentos.
4. Em **Relatórios**, abra a retrospectiva.

As contagens são agregadas e podem exigir recarregar o painel. Clique significa encaminhamento, não conversa ou matrícula.

## 7. Persistência

Com uma escola cadastrada:

```bash
docker compose restart
docker compose ps
```

Entre novamente no painel e confirme que a escola continua cadastrada. O volume `postgres_data` deve sobreviver a reinícios e a `docker compose down` comum.

## 8. Acessibilidade e layouts

No site público, confira:

- teclado e foco visível;
- alto contraste;
- tamanhos de texto;
- VLibras;
- leitura em voz alta;
- mapa e lista em smartphone, tablet e computador;
- abertura do WhatsApp no navegador e, quando disponível, no aplicativo móvel.

O painel administrativo deve continuar bloqueado abaixo de 768 px; isso é intencional.

## 9. Parar e reiniciar

```bash
# parar sem remover contêineres
docker compose stop

# iniciar novamente
docker compose start

# remover contêineres e preservar o volume
docker compose down

# reconstruir/iniciar depois de mudanças no código
docker compose up -d --build
```

Somente para descartar intencionalmente todo o banco de teste local:

```bash
docker compose down -v
```

O último comando apaga o volume e não deve ser usado em produção.

## 10. Diagnóstico

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 migrate
docker compose logs --tail=200 db
```

Se `/api/health` não responder, verifique primeiro se `migrate` terminou com código zero e se `db` está saudável.
