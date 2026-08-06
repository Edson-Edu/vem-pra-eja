"use client";

import { useEffect } from "react";
import { definirEstadoVLibras, observarEstadoVLibras, obterEstadoVLibras } from "./estadoVLibras";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    __ejaVlibrasInstalacao?: Promise<void>;
  }
}

let instalacao: Promise<void> | null = null;
// Mantém o navegador longe de uma cópia antiga do carregador oficial, que
// apontava recursos para um CDN hoje sujeito a redirecionamentos em loop.
const URL_DO_SCRIPT_VLIBRAS = "https://vlibras.gov.br/app/vlibras-plugin.js?v=20260806";
let sequenciaDeTentativaDoScript = 0;

function urlDoScriptVLibras() {
  sequenciaDeTentativaDoScript += 1;
  return `${URL_DO_SCRIPT_VLIBRAS}&tentativa=${sequenciaDeTentativaDoScript}`;
}

function widgetVLibrasEstaPronto() {
  return Boolean(
    document.querySelector("[vw-access-button] img")
    && document.querySelector("[vw-plugin-wrapper] [vp-box]"),
  );
}

/**
 * O pacote oficial não expõe um callback público para o botão X do avatar.
 * A classe `active` é, porém, a própria fonte de verdade visual do pacote:
 * ela desaparece tanto ao fechar pelo X quanto pelo seu atalho flutuante.
 */
function painelVLibrasEstaAberto() {
  return Boolean(document.querySelector<HTMLElement>("[vw-plugin-wrapper]")?.classList.contains("active"));
}

/** O Firebase publica as rotas estáticas com uma barra final. */
function rotaAtual() {
  return location.pathname.replace(/\/+$/, "") || "/";
}

/**
 * O dicionário do VLibras responde melhor a frases diretas, com verbos na
 * forma-base e sem abreviações. Nomes próprios continuam intactos para que o
 * widget recorra à datilologia apenas quando ela é realmente necessária.
 */
/**
 * Alguns nomes de benefícios chegam compostos ou flexionados. O dicionário
 * do VLibras reconhece os lemas abaixo, enquanto as formas longas podem cair
 * na datilologia. Esta normalização também é aplicada na montagem dos
 * blocos pai, antes de a camada de tradução ser criada.
 */
function normalizarTermosParaLibras(texto: string) {
  return texto
    // "Livro" isolado é soletrado pelo dicionário do widget. A expressão
    // verbal abaixo induz o sinal de leitura didática sem mudar o rótulo
    // apresentado no card.
    .replace(/\blivros?\b(?:\s+did[aá]tico(?:s)?)?/gi, "LER DIDATICO")
    // A forma verbal é reconhecida pelo dicionário; "Administração" não.
    .replace(/\badministra(?:ç(?:ã|a)o|cao)\b/gi, "ADMINISTRAR");
}

function prepararTextoParaLibras(texto: string) {
  return normalizarTermosParaLibras(expandirSiglasParaLibras(texto))
    // Siglas de dias fazem o widget soletrar letra por letra. Ele entende os
    // dias por extenso, sem hífen, como vocabulário de calendário.
    // O hífen faz o dicionário do VLibras identificar a locução como o dia da
    // semana, evitando o erro de interpretar "sexta feira" como "sexto feiro".
    .replace(/\bseg(?:unda)?(?:[-\s]*feira)?\s*(?:[-–—]|a|até|ate)\s*sex(?:ta)?(?:[-\s]*feira)?\b/gi, "segunda feira até sexta-feira")
    .replace(/\bseg(?:unda)?(?:[-\s]*feira)?\s*(?:[-–—]|a|até|ate)\s*qui(?:nt(?:a)?)?(?:[-\s]*feira)?\b/gi, "segunda feira até quinta feira")
    .replace(/\bseg(?:unda)?(?:[-\s]*feira)?\s*(?:[-–—]|a|até|ate)\s*sáb(?:ado)?(?:[-\s]*feira)?\b/gi, "segunda feira até sábado")
    .replace(/\bdias de aula\b/gi, "dias da semana")
    // Para estes termos, o lema é reconhecido pelo dicionário do VLibras;
    // o plural composto costuma cair indevidamente na datilologia.
    .replace(/\bnunca estudei\b/gi, "nunca estudar")
    .replace(/\bestudei\b|\bestudou\b|\bestuda\b|\bestudam\b/gi, "estudar")
    .replace(/\bconcluí\b|\bconcluiu\b|\bconclui\b/gi, "concluir")
    .replace(/\bquero\b|\bquer\b/gi, "querer")
    .replace(/\bcheguei\b/gi, "chegar")
    .replace(/\s+/g, " ")
    .trim();
}

function criarBlocoDeTraducao(elemento: HTMLElement, texto: string, adaptarTexto = true, enviarComoGlosa = false) {
  const textoPreparado = adaptarTexto ? prepararTextoParaLibras(texto) : texto;
  const existente = elemento.querySelector<HTMLElement>(":scope > .vlibras-bloco");
  if (existente) {
    // Não reinicia uma requisição em andamento do VLibras com o mesmo texto.
    if (existente.textContent !== textoPreparado) existente.textContent = textoPreparado;
    if (enviarComoGlosa) existente.dataset.vlibrasGloss = "true";
    else delete existente.dataset.vlibrasGloss;
    return;
  }
  elemento.style.position = "relative";
  const camada = document.createElement("span");
  camada.className = "vlibras-bloco";
  camada.setAttribute("aria-hidden", "true");
  // A versão atual do widget reconhece este atributo e chama o player
  // diretamente, sem passar o conteúdo pela API texto → glosa.
  if (enviarComoGlosa) camada.dataset.vlibrasGloss = "true";
  camada.textContent = textoPreparado;
  elemento.appendChild(camada);
}

type TermoComAlias = { padrao: RegExp; textoParaLibras: string };

const termosComAlias: TermoComAlias[] = [
  { padrao: /\blivros?\s+did[aá]ticos?\b/gi, textoParaLibras: "LER DIDATICO" },
  { padrao: /\badministra(?:ç(?:ã|a)o|cao)\b/gi, textoParaLibras: "ADMINISTRAR" },
];

/**
 * O VLibras seleciona o texto real do elemento tocado. Para manter a interface
 * com "Livros didáticos" e "Administração", mas enviar "LER DIDATICO" e
 * "ADMINISTRAR", trocamos apenas o conteúdo DOM por um alias invisível e
 * desenhamos a forma original por CSS. Assim não dependemos de timing de click
 * e o widget nunca recebe a palavra visual original.
 */
function criarAliasParaLibras(pai: HTMLElement, textoVisivel: string, textoParaLibras: string) {
  const medidor = document.createElement("span");
  medidor.textContent = textoVisivel;
  medidor.style.cssText = "position:absolute;visibility:hidden;white-space:pre;pointer-events:none;";
  pai.appendChild(medidor);
  const largura = Math.max(1, Math.ceil(medidor.getBoundingClientRect().width));
  medidor.remove();

  const alias = document.createElement("span");
  alias.className = "eja-vlibras-termo";
  alias.dataset.ejaVlibrasVisivel = textoVisivel;
  alias.style.setProperty("--eja-vlibras-largura", `${largura}px`);
  const valor = document.createElement("span");
  valor.className = "eja-vlibras-valor";
  valor.textContent = textoParaLibras;
  alias.appendChild(valor);
  return alias;
}

function aplicarAliasesParaLibras(elemento: HTMLElement) {
  if (elemento.dataset.vlibrasAliasAplicado === "true") return;
  const leitor = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT);
  const nos: Text[] = [];
  let no = leitor.nextNode();
  while (no) {
    nos.push(no as Text);
    no = leitor.nextNode();
  }

  nos.forEach((texto) => {
    if (texto.parentElement?.closest(".eja-vlibras-termo")) return;
    const original = texto.nodeValue ?? "";
    const ocorrencias: Array<{ inicio: number; fim: number; visivel: string; textoParaLibras: string }> = [];
    termosComAlias.forEach(({ padrao, textoParaLibras }) => {
      const busca = new RegExp(padrao.source, "gi");
      let resultado = busca.exec(original);
      while (resultado) {
        ocorrencias.push({
          inicio: resultado.index,
          fim: resultado.index + resultado[0].length,
          visivel: resultado[0],
          textoParaLibras,
        });
        resultado = busca.exec(original);
      }
    });
    ocorrencias.sort((a, b) => a.inicio - b.inicio || b.fim - a.fim);
    const semSobreposicao = ocorrencias.filter((ocorrencia, indice) => indice === 0 || ocorrencia.inicio >= ocorrencias[indice - 1].fim);
    if (!semSobreposicao.length || !texto.parentElement) return;

    const fragmento = document.createDocumentFragment();
    let cursor = 0;
    semSobreposicao.forEach((ocorrencia) => {
      if (ocorrencia.inicio > cursor) fragmento.append(document.createTextNode(original.slice(cursor, ocorrencia.inicio)));
      fragmento.append(criarAliasParaLibras(texto.parentElement as HTMLElement, ocorrencia.visivel, ocorrencia.textoParaLibras));
      cursor = ocorrencia.fim;
    });
    if (cursor < original.length) fragmento.append(document.createTextNode(original.slice(cursor)));
    texto.replaceWith(fragmento);
  });
  elemento.dataset.vlibrasAliasAplicado = "true";
}

function textoVisivelDoBloco(elemento: HTMLElement) {
  const copia = elemento.cloneNode(true) as HTMLElement;
  copia.querySelectorAll(".vlibras-bloco").forEach((camada) => camada.remove());
  return copia.innerText.replace(/\s+/g, " ").trim();
}

function expandirSiglasParaLibras(texto: string) {
  // Os nomes podem chegar do banco com pontos ou espaços entre as letras
  // ("E.B.M.", "E B M", "CEJA"). Normalizamos todas as formas antes de
  // entregar o bloco ao VLibras, evitando que ele datilografe as siglas.
  return texto
    .replace(/\bC\s*\.?\s*E\s*\.?\s*J\s*\.?\s*A\b\.?/gi, "Centro de Educação de Jovens e Adultos")
    .replace(/\bE\s*\.?\s*B\s*\.?\s*M\b\.?/gi, "Escola Básica Municipal")
    .replace(/\bI\s*\.?\s*F\s*\.?\s*C\b\.?/gi, "Instituto Federal Catarinense");
}

function textoDe(elemento: Element | null | undefined) {
  return elemento?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function juntarFrases(...partes: string[]) {
  const texto = partes
    .map((parte) => parte.replace(/\.\s*$/, "").trim())
    .filter(Boolean)
    .join(". ");
  return /[.!?…]$/.test(texto) ? texto : `${texto}.`;
}

function textoDaEscolaParaLibras(cartao: HTMLElement) {
  const nome = textoDe(cartao.querySelector("h2"));
  const secoes = [...cartao.querySelectorAll("p")];
  const localizacao = textoDe(secoes.find((item) => textoDe(item).includes("·")));
  const encontrarItens = (titulo: string) => {
    const cabecalho = secoes.find((item) => textoDe(item).toUpperCase() === titulo);
    return [...(cabecalho?.nextElementSibling?.querySelectorAll(":scope > span") ?? [])]
      .map((item) => textoDe(item))
      .filter(Boolean)
      .join(", ");
  };
  const turnos = encontrarItens("TURNOS DISPONÍVEIS") || "não informado";
  // Normalizamos já na extração para que o bloco pai nunca receba o rótulo
  // visual "Livros didáticos" — nem mesmo durante atualizações do card.
  const beneficios = normalizarTermosParaLibras(encontrarItens("BENEFÍCIOS OFERECIDOS")) || "não informado";
  return juntarFrases(
    expandirSiglasParaLibras(nome),
    `Localização: ${localizacao}`,
    `Turnos disponíveis: ${turnos}`,
    `Benefícios oferecidos: ${beneficios}`,
    "Deseja ver esta escola?",
  );
}

function textoDoDetalheParaLibras(bloco: HTMLElement) {
  const tipo = bloco.dataset.vlibrasPai;
  if (tipo === "resumo-escola") {
    return juntarFrases(textoDe(bloco.querySelector("h1")), textoDe(bloco.querySelector("p")));
  }
  if (tipo === "turno") {
    return juntarFrases(`Turno: ${textoDe(bloco.querySelector("strong"))}`, `Horário: ${textoDe(bloco.querySelector("small"))}`);
  }
  if (tipo === "informacao-turno") {
    return juntarFrases(`${textoDe(bloco.querySelector("small"))}: ${textoDe(bloco.querySelector("strong"))}`);
  }
  if (tipo === "como-funciona") {
    return juntarFrases(
      textoDe(bloco.querySelector("h2")),
      normalizarTermosParaLibras(textoDe(bloco.querySelector("p"))),
    );
  }
  if (tipo === "auxilios") {
    const auxilios = [...bloco.querySelectorAll("button strong")]
      .map((item) => normalizarTermosParaLibras(textoDe(item)))
      .filter(Boolean)
      .join(", ");
    return `Auxílios oferecidos: ${auxilios || "nenhum auxílio informado"}.`;
  }
  if (tipo === "orientacao-turnos") {
    return juntarFrases(textoDe(bloco.querySelector("h2")), textoDe(bloco.querySelector("p")));
  }
  return textoVisivelDoBloco(bloco);
}

function agruparBlocosDaTelaNivel() {
  if (rotaAtual() !== "/nivel") return;
  const pergunta = document.querySelector<HTMLElement>("main h1");
  if (pergunta?.innerText) criarBlocoDeTraducao(pergunta, "Você estudar até série ou ano qual?");
  const opcoes = document.querySelectorAll<HTMLElement>("main [role=button][tabindex=\"0\"]");
  const opcoesParaLibras = [
    "Eu nunca estudar.",
    "TERMINAR ESTUDAR SÉRIE 1 ATÉ 9",
    "ESTUDAR PRIMEIRO GRAU TERMINAR AGORA QUERER SEGUNDO GRAU",
  ];
  opcoes.forEach((opcao, indice) => {
    const texto = opcoesParaLibras[indice];
    if (texto) criarBlocoDeTraducao(opcao, texto);
  });
  const fraseFinal = document.querySelector<HTMLElement>("main footer p");
  if (fraseFinal?.innerText) criarBlocoDeTraducao(fraseFinal, "Todas as escolas são gratuitas. Todas oferecem auxílios para concluir os estudos.");
}

function agruparBlocosDaTelaDeMapa() {
  if (rotaAtual() !== "/escolas") return;
  const botoesDeDetalhes = [...document.querySelectorAll<HTMLButtonElement>("button")].filter((botao) => botao.textContent?.trim() === "Ver escola");
  botoesDeDetalhes.forEach((botao) => {
    const cartao = botao.closest<HTMLElement>("[class*='overflow-hidden']");
    if (!cartao) return;
    aplicarAliasesParaLibras(cartao);
    criarBlocoDeTraducao(cartao, textoDaEscolaParaLibras(cartao));
    // A ação real fica acima da camada de tradução, sem desligar o VLibras.
    botao.dataset.vlibrasAcao = "pronto";
  });
}

function agruparBlocosDaTelaDetalhes() {
  if (rotaAtual() !== "/detalhes") return;
  document.querySelectorAll<HTMLElement>("[data-vlibras-pai]").forEach((bloco) => {
    const textoAdaptado = bloco.dataset.vlibrasTextoAdaptado;
    if (textoAdaptado) {
      // O texto visível continua intacto. Esta camada é o único conteúdo que
      // o avatar recebe, sem expandir ou separar nomes próprios novamente.
      // Quando o modo é "glosa", o valor já contém a glosa oficial do
      // tradutor, com exceção de nomes próprios que devem ser soletrados.
      criarBlocoDeTraducao(bloco, textoAdaptado, false, bloco.dataset.vlibrasModo === "glosa");
      return;
    }
    const conteudo = textoDoDetalheParaLibras(bloco);
    if (conteudo) {
      if (bloco.dataset.vlibrasPai === "como-funciona" || bloco.dataset.vlibrasPai === "auxilios") {
        aplicarAliasesParaLibras(bloco);
      }
      criarBlocoDeTraducao(bloco, expandirSiglasParaLibras(conteudo));
    }
  });
}

function agruparBlocosDaTelaSucesso() {
  if (rotaAtual() !== "/sucesso") return;
  document.querySelectorAll<HTMLElement>("[data-vlibras-pai='sucesso-resumo'], [data-vlibras-pai='sucesso-passo']").forEach((bloco) => {
    const conteudo = bloco.dataset.vlibrasTexto ?? textoVisivelDoBloco(bloco);
    if (conteudo) criarBlocoDeTraducao(bloco, conteudo);
  });
}

function agruparBlocosDaPagina() {
  agruparBlocosDaTelaNivel();
  agruparBlocosDaTelaDeMapa();
  agruparBlocosDaTelaDetalhes();
  agruparBlocosDaTelaSucesso();
}

/** Acrescenta a identidade do projeto sem remover os comandos ou o crédito do VLibras. */
function adicionarMarcaVemPraEja() {
  const caixa = document.querySelector<HTMLElement>("[vw-plugin-wrapper] [vp-box]");
  if (!caixa || caixa.querySelector(".marca-vem-pra-eja")) return;

  const marca = document.createElement("div");
  marca.className = "marca-vem-pra-eja";
  marca.setAttribute("aria-label", "VemPraEJA com VLibras");

  const nome = document.createElement("strong");
  nome.textContent = "VemPraEJA";
  const apoio = document.createElement("span");
  apoio.textContent = "com VLibras";
  marca.append(nome, apoio);
  caixa.appendChild(marca);
}

function instalarVLibras() {
  const acessoExistente = document.querySelector("[vw-access-button]");
  if (instalacao && acessoExistente) return instalacao;
  if (window.__ejaVlibrasInstalacao && acessoExistente) return window.__ejaVlibrasInstalacao;
  if (document.querySelector("[vw]") && window.VLibras && acessoExistente && widgetVLibrasEstaPronto()) return Promise.resolve();

  // Se o navegador descartou a interface após voltar do segundo plano, a
  // promessa antiga não representa mais um widget utilizável.
  instalacao = null;
  window.__ejaVlibrasInstalacao = undefined;

  // Se uma tentativa anterior foi interrompida pelo navegador, ela deixa uma
  // casca vazia no DOM. Removê-la antes da nova tentativa evita que o script
  // oficial se conecte ao botão antigo (caso frequente em navegadores móveis).
  document.querySelector("[vw]")?.remove();
  document.querySelectorAll("script[data-eja-vlibras-carregador]").forEach((script) => script.remove());
  instalacao = new Promise<void>((resolve, reject) => {
    const raiz = document.createElement("div");
    raiz.setAttribute("vw", "");
    raiz.className = "enabled";
    const acesso = document.createElement("div");
    acesso.setAttribute("vw-access-button", "");
    acesso.className = "active";
    const plugin = document.createElement("div");
    plugin.setAttribute("vw-plugin-wrapper", "");
    plugin.appendChild(document.createElement("div")).className = "vw-plugin-top-wrapper";
    raiz.append(acesso, plugin);
    document.body.appendChild(raiz);

    const script = document.createElement("script");
    script.dataset.ejaVlibrasCarregador = "true";
    script.src = urlDoScriptVLibras();
    script.async = true;
    script.onload = () => {
      try {
        if (!window.VLibras) throw new Error("O script do VLibras não foi inicializado.");
        new window.VLibras.Widget("https://vlibras.gov.br/app");
        // O widget oficial prepara sua interface no window.onload. Como o app já
        // hidratou, executamos essa rotina oficial imediatamente uma única vez.
        const inicializar = window.onload;
        if (typeof inicializar === "function") inicializar.call(window, new Event("load"));
        // O carregador oficial baixa partes adicionais. Só declaramos sucesso
        // quando o botão e a caixa real foram de fato montados; assim uma
        // primeira carga parcial no celular é descartada e refeita.
        let verificacoes = 0;
        const confirmarProntidao = () => {
          const pronto = widgetVLibrasEstaPronto();
          if (pronto) { resolve(); return; }
          verificacoes += 1;
          if (verificacoes >= 12) {
            raiz.remove();
            script.remove();
            instalacao = null;
            window.__ejaVlibrasInstalacao = undefined;
            reject(new Error("O VLibras não terminou de carregar."));
            return;
          }
          window.setTimeout(confirmarProntidao, 300);
        };
        confirmarProntidao();
      } catch (erro) {
        raiz.remove();
        instalacao = null;
        window.__ejaVlibrasInstalacao = undefined;
        reject(erro);
      }
    };
    script.onerror = () => {
      raiz.remove();
      script.remove();
      instalacao = null;
      window.__ejaVlibrasInstalacao = undefined;
      reject(new Error("Não foi possível baixar o VLibras."));
    };
    document.head.appendChild(script);
  });
  window.__ejaVlibrasInstalacao = instalacao;
  return instalacao;
}

/** Carrega e acompanha o botão original do VLibras, sem inserir elementos na árvore React. */
export default function BotaoVLibras() {
  useEffect(() => {
    let quadro = 0;
    let rotaAnterior = rotaAtual();
    let primeiroPosicionamento = true;
    let acessoObservado: HTMLElement | null = null;
    let tentativasDeInstalacao = 0;
    let novaTentativa = 0;
    let sincronizacaoDoPainel = 0;
    let fimDaSincronizacaoVisual = 0;
    let painelEstavaAberto = false;
    let sincronizacaoVisualEmAndamento = false;
    const retomadasDoPainel: number[] = [];
    const verificacoesDeFechamento: number[] = [];
    let cancelado = false;
    const deveManterAberto = () => obterEstadoVLibras();
    const cancelarRetomadas = () => {
      retomadasDoPainel.splice(0).forEach((retomada) => window.clearTimeout(retomada));
    };

    const registrarFechamentoDoAvatar = () => {
      if (cancelado || sincronizacaoVisualEmAndamento || painelVLibrasEstaAberto()) return;
      // O X pertence ao pacote do Governo. Sem esta ponte ele fecha somente
      // visualmente e a preferência global continuaria indevidamente ligada.
      definirEstadoVLibras(false);
      cancelarRetomadas();
    };

    const acompanharEstadoVisualDoAvatar = () => {
      const aberto = painelVLibrasEstaAberto();
      if (painelEstavaAberto && !aberto) registrarFechamentoDoAvatar();
      painelEstavaAberto = aberto;
    };

    const alternarPainelPelaSincronizacao = (acesso: HTMLElement) => {
      sincronizacaoVisualEmAndamento = true;
      window.clearTimeout(fimDaSincronizacaoVisual);
      acesso.click();
      fimDaSincronizacaoVisual = window.setTimeout(() => {
        sincronizacaoVisualEmAndamento = false;
        painelEstavaAberto = painelVLibrasEstaAberto();
      }, 180);
    };

    const sincronizarPainelComEstadoGlobal = () => {
      window.clearTimeout(sincronizacaoDoPainel);
      sincronizacaoDoPainel = window.setTimeout(() => {
        if (cancelado) return;
        const painelAtual = document.querySelector<HTMLElement>("[vw-plugin-wrapper]");
        const acessoAtual = document.querySelector<HTMLElement>("[vw-access-button]");
        const painelAberto = Boolean(painelAtual?.classList.contains("active"));
        const deveAbrir = deveManterAberto();
        if (painelAberto !== deveAbrir && acessoAtual) alternarPainelPelaSincronizacao(acessoAtual);
        posicionar();
      }, 0);
    };

    const posicionar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        agruparBlocosDaPagina();
        adicionarMarcaVemPraEja();
        const acesso = document.querySelector<HTMLElement>("[vw-access-button]");
        const widget = acesso?.closest<HTMLElement>("[vw]");
        const painel = widget?.querySelector<HTMLElement>("[vw-plugin-wrapper]");
        if (!acesso || !widget) return;
        if (acessoObservado !== acesso) {
          acessoObservado = acesso;
          acesso.addEventListener("click", (evento) => {
            // Um click sintético é usado somente pela sincronização entre DOM
            // e estado; ele não representa uma nova escolha do usuário.
            if (!evento.isTrusted) return;

            // A intenção é calculada com a fonte global, não com a classe do
            // widget, porque o script oficial troca essa classe em momentos
            // diferentes a cada rota. Assim desligar sempre grava `false`.
            const proximoEstado = !obterEstadoVLibras();
            definirEstadoVLibras(proximoEstado);
            if (!proximoEstado) cancelarRetomadas();
            window.setTimeout(posicionar, 0);
          });
        }
        const painelAberto = Boolean(painel?.classList.contains("active"));
        const rota = rotaAtual();
        const mudouDeTela = rotaAnterior !== rota;
        rotaAnterior = rota;
        if ((primeiroPosicionamento || mudouDeTela) && deveManterAberto()) {
          // A troca de rota pode desmontar temporariamente partes internas do
          // widget. Confirmamos a abertura após a nova tela estabilizar, sem
          // reenviar a ação caso o painel já esteja ativo.
          [0, 350, 900].forEach((espera) => {
            retomadasDoPainel.push(window.setTimeout(() => {
              if (cancelado || !deveManterAberto()) return;
              const painelAtual = document.querySelector<HTMLElement>("[vw-plugin-wrapper]");
              const acessoAtual = document.querySelector<HTMLElement>("[vw-access-button]");
              if (!painelAtual?.classList.contains("active") && acessoAtual) alternarPainelPelaSincronizacao(acessoAtual);
            }, espera));
          });
        }
        primeiroPosicionamento = false;
        widget.style.right = "auto";
        widget.style.bottom = "auto";
        widget.style.transform = "none";
        widget.style.zIndex = "1300";
        widget.style.setProperty("margin", "0", "important");
        if (painelAberto) {
          const compacto = window.innerWidth < 1280;
          const celular = window.innerWidth < 768;
          const largura = Math.min(celular ? 200 : compacto ? 260 : 300, window.innerWidth - 24);
          const altura = Math.min(celular ? 320 : compacto ? 400 : 540, window.innerHeight - 24);
          widget.style.width = `${largura}px`;
          widget.style.minWidth = `${largura}px`;
          widget.style.height = `${altura}px`;
          widget.style.left = `${compacto ? Math.max(12, window.innerWidth - largura - 12) : 16}px`;
          // Na tela de detalhes, o rodapé de inscrição é fixo. O intérprete
          // sobe um pouco mais para não competir com esse botão.
          const margemInferior = celular ? (rota === "/detalhes" ? 132 : 84) : 12;
          widget.style.top = `${compacto ? Math.max(12, window.innerHeight - altura - margemInferior) : Math.max(12, Math.round((window.innerHeight - altura) / 2))}px`;
          if (painel) { painel.style.width = `${largura}px`; painel.style.height = `${altura}px`; painel.style.float = "none"; }
          acesso.style.top = "0";
          acesso.style.right = "0";
        } else {
          widget.style.width = "";
          widget.style.minWidth = "";
          widget.style.height = "";
          if (painel) { painel.style.width = ""; painel.style.height = ""; painel.style.float = ""; }
          widget.style.left = "0";
          widget.style.top = "0";
          acesso.style.top = "0";
          acesso.style.left = "auto";
          acesso.style.right = "0";
        }
      });
    };
    const observador = new MutationObserver(() => {
      acompanharEstadoVisualDoAvatar();
      posicionar();
    });
    observador.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    const carregarVLibras = () => {
      instalarVLibras()
        .then(() => {
          tentativasDeInstalacao = 0;
          posicionar();
          sincronizarPainelComEstadoGlobal();
        })
        .catch((erro) => {
          // Redes móveis às vezes abortam a primeira baixa do script oficial.
          // Tentamos novamente de forma limpa, sem exibir erro para o usuário.
          if (cancelado || tentativasDeInstalacao >= 3) {
            console.warn("VLibras indisponível:", erro);
            return;
          }
          tentativasDeInstalacao += 1;
          novaTentativa = window.setTimeout(carregarVLibras, 1200 * tentativasDeInstalacao);
        });
    };
    const recuperarWidgetParcial = () => {
      if (cancelado || widgetVLibrasEstaPronto()) return;
      instalacao = null;
      window.__ejaVlibrasInstalacao = undefined;
      document.querySelector("[vw]")?.remove();
      document.querySelectorAll("script[data-eja-vlibras-carregador]").forEach((script) => script.remove());
      carregarVLibras();
    };
    const pararDeObservarEstado = observarEstadoVLibras(() => sincronizarPainelComEstadoGlobal());

    const aoClicarNoFecharDoAvatar = (evento: MouseEvent) => {
      if (!evento.isTrusted || !(evento.target instanceof Element)) return;
      const controle = evento.target.closest<HTMLElement>("[vw-plugin-wrapper] [class*='close' i], [vw-plugin-wrapper] [aria-label*='fechar' i], [vw-plugin-wrapper] [title*='fechar' i]");
      if (!controle) return;

      // Alguns navegadores aplicam a classe de fechamento só ao término da
      // animação do avatar. Conferimos logo depois e novamente após ela.
      [0, 250].forEach((espera) => {
        verificacoesDeFechamento.push(window.setTimeout(() => {
          registrarFechamentoDoAvatar();
          painelEstavaAberto = painelVLibrasEstaAberto();
        }, espera));
      });
    };

    carregarVLibras();
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible" && !widgetVLibrasEstaPronto()) recuperarWidgetParcial();
    };
    const aoFalharRecurso = (evento: Event) => {
      const recurso = evento.target as HTMLScriptElement | HTMLImageElement | null;
      const endereco = recurso?.src ?? "";
      if (/vlibras\.gov\.br|cdn\.jsdelivr\.net/i.test(endereco)) recuperarWidgetParcial();
    };
    addEventListener("visibilitychange", aoFicarVisivel);
    addEventListener("error", aoFalharRecurso, true);
    addEventListener("resize", posicionar);
    document.addEventListener("click", aoClicarNoFecharDoAvatar, true);
    const intervalo = window.setInterval(posicionar, 500);
    const vigiaDeProntidao = window.setTimeout(recuperarWidgetParcial, 6000);
    return () => {
      cancelAnimationFrame(quadro);
      cancelado = true;
      observador.disconnect();
      removeEventListener("visibilitychange", aoFicarVisivel);
      removeEventListener("error", aoFalharRecurso, true);
      removeEventListener("resize", posicionar);
      window.clearInterval(intervalo);
      window.clearTimeout(novaTentativa);
      window.clearTimeout(sincronizacaoDoPainel);
      window.clearTimeout(fimDaSincronizacaoVisual);
      window.clearTimeout(vigiaDeProntidao);
      retomadasDoPainel.forEach((retomada) => window.clearTimeout(retomada));
      verificacoesDeFechamento.forEach((verificacao) => window.clearTimeout(verificacao));
      pararDeObservarEstado();
      document.removeEventListener("click", aoClicarNoFecharDoAvatar, true);
    };
  }, []);
  return null;
}
