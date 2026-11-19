import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const escolaId = "03373386-e056-490b-b1b4-b1a11d63a4bf";
const turnoId = "97dca41a-4987-4f89-9998-0f1252b84d6d";
const nivel = "Ensino Médio";
const pastaDeResultados = path.resolve("test-results/public-regressions");

const tamanhos = [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [428, 926],
  [768, 1024],
  [1024, 768],
  [1366, 768],
];

await fs.mkdir(pastaDeResultados, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  await testarResponsividade();
  await testarGaleriaMapaELocalizacao();
  await testarLocalizacaoNegadaEIndisponivel();
  console.log(`Interações públicas verificadas em ${tamanhos.length} viewports. Capturas: ${pastaDeResultados}`);
} finally {
  await browser.close();
}

async function contextoComFluxo(viewport, opcoes = {}) {
  const context = await browser.newContext({
    viewport,
    hasTouch: viewport.width < 1024,
    isMobile: viewport.width < 768,
    ...opcoes,
  });
  await context.addInitScript(({ escolaId, turnoId, nivel }) => {
    try {
      sessionStorage.setItem("eja-fluxo-iniciado", "true");
      sessionStorage.setItem("eja-fluxo-nivel", nivel);
      sessionStorage.setItem("eja-fluxo-escola", escolaId);
      sessionStorage.setItem("eja-fluxo-turno", turnoId);
    } catch {
      // Páginas sem origem, como a guia bloqueada do WhatsApp, não têm storage.
    }
  }, { escolaId, turnoId, nivel });
  return context;
}

async function esperarInterface(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0.001ms!important;animation-delay:0ms!important;transition-duration:0.001ms!important}" });
}

async function testarResponsividade() {
  for (const [width, height] of tamanhos) {
    const context = await contextoComFluxo({ width, height }, {
      geolocation: { latitude: -27.016, longitude: -48.659 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    const rotulo = `${width}x${height}`;

    await page.goto(`${baseUrl}/detalhes?escola=${escolaId}&nivel=${encodeURIComponent(nivel)}`);
    await esperarInterface(page);
    await page.getByRole("button", { name: /Noite/ }).click();
    const rodape = page.locator("[data-eja-rodape-contato]");
    const ultimoAuxilio = page.getByRole("button", { name: /Auxílio para mães estudantes/ });
    await rodape.waitFor();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(100);

    const medidasDetalhes = await page.evaluate(() => {
      const conteudo = document.querySelector("[data-eja-conteudo-detalhes]");
      const rodape = document.querySelector("[data-eja-rodape-contato]");
      if (!(conteudo instanceof HTMLElement) || !(rodape instanceof HTMLElement)) throw new Error("Estrutura de detalhes ausente");
      return {
        padding: Number.parseFloat(getComputedStyle(conteudo).paddingBottom),
        rodape: rodape.getBoundingClientRect().height,
        chegouAoFim: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
      };
    });
    assert.ok(medidasDetalhes.padding >= medidasDetalhes.rodape + 23, `${rotulo}: espaço inferior não acompanha o CTA`);
    assert.equal(medidasDetalhes.chegouAoFim, true, `${rotulo}: a página de detalhes não alcança o fim`);
    const caixaAuxilio = await ultimoAuxilio.boundingBox();
    const caixaRodape = await rodape.boundingBox();
    assert.ok(caixaAuxilio && caixaRodape && caixaAuxilio.y + caixaAuxilio.height <= caixaRodape.y + 1, `${rotulo}: último auxílio ficou sob o CTA`);
    await page.screenshot({ path: path.join(pastaDeResultados, `detalhes-${rotulo}.png`), fullPage: false });

    await page.goto(`${baseUrl}/conclusao?escola=${escolaId}&nivel=${encodeURIComponent(nivel)}&turno=${turnoId}`);
    await esperarInterface(page);
    const selo = page.locator(".sucesso-selo");
    const cartao = page.locator(".sucesso-cartao");
    const cabecalho = page.locator("[data-eja-cabecalho-fluxo]");
    const reabrir = page.getByRole("link", { name: /Abrir WhatsApp novamente/ });
    const voltar = page.getByRole("button", { name: /Voltar ao início/ });
    await selo.waitFor();
    const [caixaSelo, caixaCartao, caixaCabecalho, caixaReabrir, caixaVoltar] = await Promise.all([
      selo.boundingBox(), cartao.boundingBox(), cabecalho.boundingBox(), reabrir.boundingBox(), voltar.boundingBox(),
    ]);
    const diagnosticoViewport = await page.evaluate(() => {
      const main = document.querySelector(".sucesso-tela");
      const header = document.querySelector("[data-eja-cabecalho-fluxo]");
      return {
        innerWidth: window.innerWidth,
        mediaMobile: matchMedia("(max-width: 767px)").matches,
        displayMain: main ? getComputedStyle(main).display : null,
        paddingTopMain: main ? getComputedStyle(main).paddingTop : null,
        alturaHeader: header ? getComputedStyle(header).height : null,
      };
    });
    await page.screenshot({ path: path.join(pastaDeResultados, `conclusao-${rotulo}.png`), fullPage: false });
    assert.ok(caixaSelo && caixaCartao && caixaSelo.y >= caixaCartao.y, `${rotulo}: selo recortado no topo do cartão`);
    assert.ok(caixaSelo && caixaCabecalho && caixaSelo.y >= caixaCabecalho.y + caixaCabecalho.height, `${rotulo}: selo ficou sob o cabeçalho (${JSON.stringify({ caixaSelo, caixaCabecalho, diagnosticoViewport })})`);
    assert.ok(caixaReabrir && caixaVoltar && caixaVoltar.y - (caixaReabrir.y + caixaReabrir.height) <= 20, `${rotulo}: espaço artificial entre botões`);
    await voltar.scrollIntoViewIfNeeded();
    await assert.doesNotReject(() => voltar.waitFor({ state: "visible" }), `${rotulo}: botão de voltar inacessível`);
    await context.close();
  }
}

async function testarGaleriaMapaELocalizacao() {
  const context = await contextoComFluxo({ width: 390, height: 844 }, {
    geolocation: { latitude: -27.016, longitude: -48.659 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/escolas?nivel=${encodeURIComponent(nivel)}`);
  await esperarInterface(page);
  const galeria = page.locator("[data-eja-galeria]");
  await galeria.waitFor();
  await page.waitForFunction(() => sessionStorage.getItem("eja-localizacao-usuario"));
  await page.waitForTimeout(800);
  assert.equal(await galeria.locator(":scope > span").filter({ hasText: "MAIS PRÓXIMA" }).count(), 1, "localização autorizada não destacou a escola mais próxima");
  assert.match(await page.locator("[data-eja-legenda-mapa]").innerText(), /mais próxima à mais distante/);

  const antes = await galeria.getAttribute("data-foto-atual");
  const transformacaoAntes = await page.locator(".leaflet-map-pane").evaluate((elemento) => getComputedStyle(elemento).transform);
  const caixa = await galeria.boundingBox();
  assert.ok(caixa, "galeria não possui área interativa");
  await gestoDeToque(page, caixa.x + caixa.width * 0.78, caixa.y + caixa.height / 2, caixa.x + caixa.width * 0.22, caixa.y + caixa.height / 2);
  await page.waitForFunction((anterior) => document.querySelector("[data-eja-galeria]")?.getAttribute("data-foto-atual") !== anterior, antes);
  const transformacaoDepois = await page.locator(".leaflet-map-pane").evaluate((elemento) => getComputedStyle(elemento).transform);
  assert.equal(transformacaoDepois, transformacaoAntes, "arrastar a galeria movimentou o mapa");

  const rolagem = page.locator("[data-eja-rolagem-escolas]");
  await page.evaluate(() => document.querySelector("[data-eja-rolagem-escolas]")?.scrollTo(0, 0));
  await gestoDeToque(page, caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.8, caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.2);
  await page.waitForTimeout(150);
  assert.ok(await rolagem.evaluate((elemento) => elemento.scrollTop) > 0, "gesto vertical na galeria não rolou a lista");

  const mapa = page.locator(".leaflet-container");
  const caixaMapa = await mapa.boundingBox();
  const caixaLista = await page.locator("[data-eja-lista-escolas]").boundingBox();
  assert.ok(caixaMapa && caixaLista, "mapa ou painel não está visível");
  const yMapa = Math.max(150, Math.min(caixaLista.y - 30, 240));
  const mapaAntes = await page.locator(".leaflet-map-pane").evaluate((elemento) => getComputedStyle(elemento).transform);
  await gestoDeToque(page, caixaMapa.x + caixaMapa.width * 0.7, yMapa, caixaMapa.x + caixaMapa.width * 0.3, yMapa);
  await page.waitForTimeout(300);
  const mapaDepois = await page.locator(".leaflet-map-pane").evaluate((elemento) => getComputedStyle(elemento).transform);
  assert.notEqual(mapaDepois, mapaAntes, "o mapa deixou de responder ao arraste próprio");
  await page.screenshot({ path: path.join(pastaDeResultados, "galeria-mapa-localizacao.png"), fullPage: false });
  await context.close();
}

async function testarLocalizacaoNegadaEIndisponivel() {
  const negada = await contextoComFluxo({ width: 390, height: 844 });
  const paginaNegada = await negada.newPage();
  await paginaNegada.goto(`${baseUrl}/escolas?nivel=${encodeURIComponent(nivel)}`);
  await esperarInterface(paginaNegada);
  await paginaNegada.locator("[data-eja-legenda-mapa]").waitFor();
  assert.match(await paginaNegada.locator("[data-eja-legenda-mapa]").innerText(), /Localização indisponível/);
  assert.equal(await paginaNegada.evaluate(() => sessionStorage.getItem("eja-localizacao-usuario")), null);
  await negada.close();

  const indisponivel = await contextoComFluxo({ width: 390, height: 844 });
  await indisponivel.addInitScript(() => {
    try { delete Navigator.prototype.geolocation; } catch { /* navegador mantém o fluxo de indisponibilidade */ }
  });
  const paginaIndisponivel = await indisponivel.newPage();
  await paginaIndisponivel.goto(`${baseUrl}/escolas?nivel=${encodeURIComponent(nivel)}`);
  await esperarInterface(paginaIndisponivel);
  await paginaIndisponivel.locator("[data-eja-legenda-mapa]").waitFor();
  assert.match(await paginaIndisponivel.locator("[data-eja-legenda-mapa]").innerText(), /Localização indisponível/);
  assert.equal(await paginaIndisponivel.evaluate(() => "geolocation" in navigator), false);
  await indisponivel.close();
}

async function gestoDeToque(page, inicioX, inicioY, fimX, fimY) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: inicioX, y: inicioY }] });
  for (let passo = 1; passo <= 6; passo++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{
        x: inicioX + (fimX - inicioX) * passo / 6,
        y: inicioY + (fimY - inicioY) * passo / 6,
      }],
    });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}
