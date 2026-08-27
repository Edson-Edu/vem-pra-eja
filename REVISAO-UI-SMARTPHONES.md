# Revisão de UI e acessibilidade — 27/08/2026

Implementada e validada localmente; publicada como teste no Firebase em 27/08/2026, às 16:43 de Brasília, após autorização explícita. A reserva original continua intacta; veja `TESTE-FIREBASE.md` para versão atual e procedimento de retorno.

## Pontos atendidos

- **1, 2, 4 e 9:** botão único Acessibilidade desde a abertura; menu inferior no smartphone e diálogo compacto em telas maiores. Alto contraste, VLibras e áudio com nome, descrição, estado escrito e `role="switch"`. Fechamento por botão/Escape, foco devolvido ao acionador e abertura automática pausada enquanto o menu estiver aberto.
- **3:** seta acompanhada de Voltar, com área mínima de toque de 44 px.
- **5 e 11:** removidas a abreviação no código e as reticências nos nomes do mapa. No celular, o nome completo da escola selecionada permanece visível; os demais aparecem ao selecionar, focar ou passar o ponteiro, evitando rótulos sobrepostos. Nomes acessíveis completos em todos os marcadores.
- **6 e 11:** legenda explica o significado real das cores: azul = selecionada, vermelho = outras escolas. Números indicam proximidade apenas quando existe localização disponível; caso contrário, indicam ordem da lista. A legenda fica junto ao mapa, no cabeçalho da lista, sem cobrir os pinos.
- **7 e 8:** resolução de ícones por texto normalizado (acentos, plural e complementos): camiseta, livro, talheres, ônibus e símbolo genérico de auxílio para desconhecidos. O cabeçalho de Auxílios deixou de usar ônibus.
- **10:** indicador com Nível, Escola, Turno e Cadastro; textos visuais, ARIA, resumo de áudio e tradução revisados.
- **12:** Inscrever outra pessoa retorna diretamente ao Nível, limpa o contexto anterior e preserva preferências de acessibilidade. Voltar ao início continua disponível.

## Preservação e acessibilidade

- Pacote local estável do VLibras não foi atualizado nem alterado. A integração usa os eventos existentes para que comandos do site não sejam interceptados apenas para tradução.
- Botões de áudio por bloco preservados; resumo global fornecido pela tela atual ao novo menu. Leitura pode ser desligada durante o carregamento.
- Menu usa diálogo nativo, mantém o fundo inerte e permite rolar em telas baixas.
- Ajustes de distribuição da tela Nível e enquadramento compacto do mapa restritos a larguras menores que 768 px. Textos e funcionalidades comuns consistentes nos três formatos.
- Sem mudanças no admin, Analytics, banco de inscrições, Azure ou implantação.

## Verificações executadas

- `npm run build`: passou.
- `node --test tests/ui-accessibility.test.mjs`: quatro testes; ícones, rótulos acessíveis, limpeza de contexto e armazenamento indisponível.
- ESLint nos componentes alterados: sem erros; cinco avisos de dependências de hooks já existentes em MapaEscolas foram mantidos sem refatoração ampla.
- Navegador: 320×568, 360×740, 390×844 e 430×932; tablet 820×1180; desktop 1440×900.
- Dimensões dos cards/rodapé do Nível em tablet e desktop coincidem com a referência anterior. Mapa sem rolagem horizontal nos dois formatos maiores.
- Ligar/desligar contraste e áudio; abrir/fechar VLibras pelo menu; reabrir o menu com VLibras ativo; Escape e retorno do foco; pausa/retomada da abertura.
- Fluxo Nível → Escola → Turno → Cadastro → confirmação → Inscrever outra pessoa. Para a confirmação foi usado o atalho existente Pular cadastro; nenhum formulário foi enviado ao banco.

Limites: validação por dimensões no navegador, não em aparelhos físicos. A ordenação por proximidade tem proteção para localização indisponível; não foi fornecida uma posição real durante o teste.

## Segunda rodada — mapa, confirmação e exclusividade assistiva

Esta rodada foi inicialmente validada somente no localhost. Depois, o usuário autorizou publicar o conjunto como novo teste: fonte `1faf15a`, Hosting `948c95ec0c9d9054`. A reserva original do Firebase permanece inalterada.

- **Mobile (<768 px):** legenda ancorada acima da lista/contagem, sobre o mapa. O painel reserva pelo menos 360 px para a região do mapa quando a altura permite. Pinos sobrepostos são separados automaticamente na primeira exibição, com linhas até as coordenadas reais; seleção, navegação e localização original são preservadas. A separação não interfere no zoom/pan escolhido pela pessoa.
- **Carregamento do mapa:** aguarda CSS e JavaScript do Leaflet; enquadra depois de criar os marcadores, acompanha mudanças de tamanho e usa as escolas atuais nos callbacks. O primeiro enquadramento mobile não depende de animação ou toque.
- **Ícone mobile:** PersonStanding (pessoa de braços abertos). O ícone/layout de tablet e desktop não foi substituído.
- **Detalhes mobile:** nome completo medido com a fonte real e o espaço do botão de áudio. Reajuste após resize, carregamento de fonte e ativação do leitor; em 768 px ou mais o ajuste é removido e a tipografia original permanece.
- **Cadastro:** estado neutro “Carregando cadastro...” também no fallback de Suspense; a proteção do fluxo continua funcionando.
- **Sucesso mobile:** stepper oculto também para a árvore de acessibilidade; cabeçalho compacto. Cartão branco restaurado com altura mínima calculada por `100dvh`, margens e área segura. Em telas baixas o conteúdo cresce com rolagem, sem cortar os botões. Tablet e desktop mantêm seu stepper e suas regras anteriores.
- **Exclusividade funcional em todos os dispositivos:** estado único para áudio/Libras; desliga o anterior antes de ligar o próximo, cancela filas/falas em andamento e bloqueia fallback de voz tardio. Sessões antigas com os dois ligados são normalizadas. Alto contraste permanece independente. Menu explica a troca automática com texto e resumo de voz.
- **Integração VLibras:** a camada de tradução não substitui mais `position: absolute/fixed` por `relative`, o que deslocava a legenda. Pacote vendorizado e versão do intérprete permanecem intactos.

### Validação desta rodada

- Oito testes automatizados: os quatro anteriores mais exclusividade/ordem dos eventos, recuperação de sessão/storage bloqueado, falha de áudio tardia e separação de pinos.
- Navegador em 320×568, 390×844, 430×932, 820×1180 e 1440×900. Quatro pinos visíveis sem toque na primeira abertura em 320 e 390 px; legenda absoluta somente no mobile e sem overflow horizontal.
- Nome da escola em uma linha, inclusive com áudio ativo em 320 px; tipografia de 30 px sem ajuste inline em tablet/desktop.
- Confirmação em 390 px: cartão branco de 756 px de altura dentro do viewport de 844 px. Em 320×568 há rolagem natural; em tablet/desktop o stepper continua visível e o cabeçalho mantém 120 px.
- Trocas Áudio → Libras e Libras → Áudio testadas pela interface, com contraste permanecendo ligado; avatar fecha ao ativar áudio.
- Fluxo Detalhes → Cadastro → Sucesso → Inscrever outra pessoa validado pelo atalho existente “Pular cadastro”, sem enviar inscrição ao banco.
