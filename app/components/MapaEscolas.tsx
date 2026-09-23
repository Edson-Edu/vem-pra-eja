"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Escola } from "../lib/escolas";
import type { LocalizacaoUsuario } from "../lib/localizacao";

declare global {
  interface Window { L?: any; }
}

let leafletEmCarregamento: Promise<void> | null = null;
const centroInicial: [number, number] = [-27.0, -48.63];

type Props = {
  escolas: Escola[];
  selecionada?: string;
  onMarcadorClick: (id: string) => void;
  cabecalhoRef: RefObject<HTMLElement | null>;
  listaRef: RefObject<HTMLElement | null>;
  localizacaoUsuario?: LocalizacaoUsuario | null;
  focoNoMapa: number;
  reenquadrar: number;
  onVisaoAlterada: (alterada: boolean) => void;
};

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[caractere] ?? caractere);
}

function carregarLeaflet() {
  if (leafletEmCarregamento) return leafletEmCarregamento;
  const estilos = new Promise<void>((resolve, reject) => {
    const existente = document.querySelector<HTMLLinkElement>("link[data-eja-leaflet]");
    if (existente?.sheet) return resolve();
    const css = existente ?? document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    css.dataset.ejaLeaflet = "pronto";
    css.addEventListener("load", () => resolve(), { once: true });
    css.addEventListener("error", () => { css.remove(); reject(new Error("Não foi possível carregar o estilo do mapa.")); }, { once: true });
    if (!existente) document.head.appendChild(css);
  });
  const codigo = new Promise<void>((resolve, reject) => {
    if (window.L) return resolve();
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => { if (window.L) resolve(); else reject(new Error("Não foi possível inicializar o mapa.")); };
    script.onerror = () => { leafletEmCarregamento = null; reject(new Error("Não foi possível carregar o mapa.")); };
    document.head.appendChild(script);
  });
  // Sem o CSS, os ícones podem ser medidos/posicionados como elementos comuns.
  leafletEmCarregamento = Promise.all([estilos, codigo]).then(() => undefined).catch((erro) => {
    leafletEmCarregamento = null;
    throw erro;
  });
  return leafletEmCarregamento;
}

export default function MapaEscolas({ escolas, selecionada, onMarcadorClick, cabecalhoRef, listaRef, localizacaoUsuario, focoNoMapa, reenquadrar, onVisaoAlterada }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<any>(null);
  const marcadoresRef = useRef<any[]>([]);
  const marcadorDoUsuarioRef = useRef<any>(null);
  const escolasEnquadradasRef = useRef("");
  const ultimaSelecaoRef = useRef<string | undefined>(undefined);
  const usuarioInteragiuRef = useRef(false);
  const aplicandoEnquadramentoRef = useRef(false);
  const enquadrarAtualRef = useRef<() => void>(() => undefined);
  const [pronto, setPronto] = useState(false);

  const areaVisivel = useCallback(() => {
    const mapa = elementRef.current?.getBoundingClientRect();
    if (!mapa) return null;

    const esquerda = mapa.left;
    let topo = mapa.top;
    let direita = mapa.right;
    let base = mapa.bottom;
    const cabecalho = cabecalhoRef.current?.getBoundingClientRect();
    const lista = listaRef.current?.getBoundingClientRect();

    // Reserva a faixa do título flutuante, sem alterar o tamanho do mapa.
    if (cabecalho && cabecalho.bottom > topo) topo = Math.min(mapa.bottom, cabecalho.bottom + (window.innerWidth < 768 ? 48 : 0));
    if (lista) {
      const ocupaLarguraToda = lista.left <= mapa.left + 1 && lista.right >= mapa.right - 1;
      if (ocupaLarguraToda) {
        const legenda = window.innerWidth < 768 ? listaRef.current?.querySelector("[data-eja-legenda-mapa]")?.getBoundingClientRect() : null;
        base = Math.max(topo, Math.min(base, legenda ? legenda.top - 8 : lista.top));
      }
      else if (lista.right >= mapa.right - 1) direita = Math.max(esquerda, Math.min(direita, lista.left));
    }

    return { mapa, esquerda, topo, direita, base };
  }, [cabecalhoRef, listaRef]);

  const enquadrarEscolas = (forcar = false) => {
    const mapa = mapaRef.current;
    const L = window.L;
    const area = areaVisivel();
    if (!mapa || !L || !area || !escolas.length) return;
    if (usuarioInteragiuRef.current && !forcar) {
      mapa.invalidateSize({ pan: false });
      return;
    }
    const larguraVisivel = area.direita - area.esquerda;
    const alturaVisivel = area.base - area.topo;
    mapa.invalidateSize({ pan: false });
    const tamanhoDoMapa = mapa.getSize();
    if (tamanhoDoMapa.x < 2 || tamanhoDoMapa.y < 2 || larguraVisivel < 2 || alturaVisivel < 2) return;
    const pontos = escolas
      .map((escola) => [Number(escola.latitude), Number(escola.longitude)] as [number, number])
      .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));
    if (localizacaoUsuario && Number.isFinite(localizacaoUsuario.latitude) && Number.isFinite(localizacaoUsuario.longitude)) {
      pontos.push([localizacaoUsuario.latitude, localizacaoUsuario.longitude]);
    }
    if (!pontos.length) return;
    const bounds = L.latLngBounds(pontos);
    if (!bounds.isValid()) return;
    const celular = window.innerWidth < 768;
    const margemHorizontal = celular ? 80 : 24;
    const margemSuperior = celular ? Math.min(84, alturaVisivel * 0.45) : 24;
    const paddingTopLeft: [number, number] = [Math.min(tamanhoDoMapa.x - 2, Math.max(0, area.esquerda - area.mapa.left + margemHorizontal)), Math.min(tamanhoDoMapa.y - 2, Math.max(0, area.topo - area.mapa.top + margemSuperior))];
    const paddingBottomRight: [number, number] = [Math.min(tamanhoDoMapa.x - 2, Math.max(0, area.mapa.right - area.direita + margemHorizontal)), Math.min(tamanhoDoMapa.y - 2, Math.max(0, area.mapa.bottom - area.base + 24))];
    // O Leaflet exige que a soma das duas margens seja menor que o mapa.
    // Durante a transição de rota, o painel ainda pode ocupar toda a altura.
    const limitarEixo = (inicio: number, fim: number, tamanho: number): [number, number] => {
      const maximo = Math.max(0, tamanho - 2);
      const total = inicio + fim;
      if (total <= maximo || total === 0) return [inicio, fim];
      const proporcao = maximo / total;
      return [Math.floor(inicio * proporcao), Math.floor(fim * proporcao)];
    };
    [paddingTopLeft[0], paddingBottomRight[0]] = limitarEixo(paddingTopLeft[0], paddingBottomRight[0], tamanhoDoMapa.x);
    [paddingTopLeft[1], paddingBottomRight[1]] = limitarEixo(paddingTopLeft[1], paddingBottomRight[1], tamanhoDoMapa.y);
    try {
      aplicandoEnquadramentoRef.current = true;
      onVisaoAlterada(false);
      mapa.once("moveend", () => { aplicandoEnquadramentoRef.current = false; });
      mapa.fitBounds(bounds, { paddingTopLeft, paddingBottomRight, maxZoom: 14, ...(celular ? { animate: false } : {}) });
      if (celular) aplicandoEnquadramentoRef.current = false;
    } catch {
      aplicandoEnquadramentoRef.current = false;
      // Aguarda o ResizeObserver quando o mapa terminar de ocupar a tela.
    }
  };

  useEffect(() => { enquadrarAtualRef.current = enquadrarEscolas; });

  const centralizarNaAreaVisivel = (escola: Escola, aproximar = false) => {
    const mapa = mapaRef.current;
    const L = window.L;
    const area = areaVisivel();
    if (!mapa || !L || !area) return;
    const alvo = L.latLng(escola.latitude, escola.longitude);
    const zoomAtual = mapa.getZoom();
    const zoomDoAlvo = aproximar ? Math.min(17, Math.max(16, zoomAtual + 2)) : zoomAtual;
    const pontoDoAlvo = mapa.project(alvo, zoomDoAlvo);
    const centroDoMapa = mapa.getSize().divideBy(2);
    const centroVisivel = L.point(
      (area.esquerda + area.direita) / 2 - area.mapa.left,
      (area.topo + area.base) / 2 - area.mapa.top,
    );
    const novoCentro = mapa.unproject(pontoDoAlvo.add(centroDoMapa.subtract(centroVisivel)), zoomDoAlvo);
    usuarioInteragiuRef.current = true;
    onVisaoAlterada(true);
    // `flyTo` suaviza a aproximação e mantém o enquadramento anterior durante
    // a animação. Assim os tiles não somem enquanto os de maior zoom chegam.
    mapa.stop();
    mapa.flyTo(novoCentro, zoomDoAlvo, {
      animate: true,
      duration: 1.15,
      easeLinearity: 0.2,
      noMoveStart: true,
    });
  };

  useEffect(() => {
    let ativo = true;
    carregarLeaflet().then(() => {
      if (!ativo || !elementRef.current || mapaRef.current) return;
      const L = window.L!;
      // O Leaflet só cria tiles depois de receber um centro/zoom. Sem esse
      // estado inicial a primeira navegação pode depender do fitBounds que
      // acontece em outro efeito e resultar em uma área branca.
      const mapa = L.map(elementRef.current, {
        zoomControl: false,
        attributionControl: true,
        zoomAnimation: true,
        fadeAnimation: true,
        zoomAnimationThreshold: 4,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
      }).setView(centroInicial, 12);
      L.control.zoom({ position: "bottomright" }).addTo(mapa);
      const camadaBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
        // Mantém uma margem generosa dos tiles atuais durante zoom/pan para
        // não expor o fundo vazio enquanto a nova rua está sendo carregada.
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: false,
      }).addTo(mapa);
      mapaRef.current = mapa;
      escolasEnquadradasRef.current = "";
      // O VLibras pode alterar a área de pintura durante a troca de tela. Revalidar
      // o tamanho e redesenhar os tiles evita um primeiro carregamento em branco.
      const estabilizarMapa = (redesenhar = false) => { if (!ativo || mapaRef.current !== mapa) return; mapa.invalidateSize({ pan: false }); if (redesenhar) camadaBase.redraw(); enquadrarAtualRef.current(); };
      mapa.on("dragstart", () => {
        usuarioInteragiuRef.current = true;
        onVisaoAlterada(true);
      });
      mapa.on("zoomstart", () => {
        if (aplicandoEnquadramentoRef.current) return;
        usuarioInteragiuRef.current = true;
        onVisaoAlterada(true);
      });
      mapa.whenReady(() => {
        requestAnimationFrame(() => estabilizarMapa(true));
        window.setTimeout(() => estabilizarMapa(true), 180);
        window.setTimeout(estabilizarMapa, 700);
      });
      camadaBase.once("load", () => estabilizarMapa());
      setPronto(true);
    }).catch(() => undefined);
    return () => { ativo = false; if (mapaRef.current) { mapaRef.current.remove(); mapaRef.current = null; } };
  // O mapa é criado uma única vez. As versões atuais dos callbacks são lidas
  // por refs para não recriar o Leaflet ao mudar seleção ou breakpoint.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    const L = window.L;
    if (!mapa || !L || !escolas.length) return;
    marcadoresRef.current.forEach((marcador) => marcador.remove());
    marcadoresRef.current = escolas.map((escola, indice) => ({ escola, indice })).filter(({ escola }) => Number.isFinite(Number(escola.latitude)) && Number.isFinite(Number(escola.longitude))).map(({ escola, indice }) => {
      const ativo = escola.id === selecionada;
      const tamanho = ativo ? 38 : 34;
      const cor = ativo ? "var(--eja-cor-azul-acao)" : "#E44335";
      const rotulo = escaparHtml(escola.nome);
      const icone = L.divIcon({ className: "eja-marcador-escola", html: `<div class="eja-marcador-conteudo"><span class="eja-marcador-nome"><span data-eja-nome-mapa>${rotulo}</span></span><div class="eja-marcador-pino" style="width:${tamanho}px;height:${tamanho}px;background:${cor}"><span>${indice + 1}</span></div></div>`, iconSize: [142, 44], iconAnchor: [71, 44] });
      const marcador = L.marker([escola.latitude, escola.longitude], { icon: icone, title: `${indice + 1}. ${escola.nome}`, alt: escola.nome, keyboard: true, zIndexOffset: ativo ? 1000 : 0 }).addTo(mapa).on("click", () => onMarcadorClick(escola.id));
      const elemento = marcador.getElement();
      elemento?.setAttribute("aria-label", `${indice + 1}. ${escola.nome}${ativo ? ". Selecionada" : ""}`);
      elemento?.setAttribute("aria-pressed", String(ativo));
      return marcador;
    });
    const chaveDasEscolas = `${escolas.map((escola) => `${escola.id}:${escola.latitude}:${escola.longitude}`).join("|")}|usuario:${localizacaoUsuario ? `${localizacaoUsuario.latitude}:${localizacaoUsuario.longitude}` : ""}`;
    if (escolasEnquadradasRef.current !== chaveDasEscolas) {
      escolasEnquadradasRef.current = chaveDasEscolas;
      ultimaSelecaoRef.current = selecionada;
      enquadrarEscolas();
    }
    // O primeiro enquadramento deve ocorrer também depois de os ícones terem
    // entrado no DOM, sem depender de toque ou do carregamento dos tiles.
    const quadro = requestAnimationFrame(() => {
      if (mapaRef.current !== mapa) return;
      marcadoresRef.current.forEach((marcador) => marcador.update());
      enquadrarAtualRef.current();
    });
    return () => cancelAnimationFrame(quadro);
  // enquadrarEscolas delega à ref atual e não deve recriar marcadores.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolas, localizacaoUsuario, onMarcadorClick, selecionada, pronto]);

  useEffect(() => {
    const mapa = mapaRef.current;
    const L = window.L;
    if (!mapa || !L) return;
    marcadorDoUsuarioRef.current?.remove();
    marcadorDoUsuarioRef.current = null;
    if (!localizacaoUsuario) return;

    const icone = L.divIcon({
      className: "",
      html: `<div style="position:relative;width:108px;height:48px;font-family:Inter,Arial,sans-serif"><span style="position:absolute;top:0;left:50%;transform:translateX(-50%);white-space:nowrap;border-radius:999px;background:#0b75e8;color:#fff;padding:3px 7px;font-size:10px;font-weight:800;box-shadow:0 1px 5px #0005">Você está aqui</span><span style="position:absolute;top:26px;left:50%;width:18px;height:18px;transform:translateX(-50%);border:3px solid #fff;border-radius:50%;background:#0b75e8;box-shadow:0 1px 5px #0006"></span></div>`,
      iconSize: [108, 48],
      iconAnchor: [54, 35],
    });
    marcadorDoUsuarioRef.current = L.marker([localizacaoUsuario.latitude, localizacaoUsuario.longitude], { icon: icone, interactive: false }).addTo(mapa);
  }, [localizacaoUsuario, pronto]);

  useEffect(() => {
    if (!focoNoMapa) return;
    const escola = escolas.find((item) => item.id === selecionada);
    if (!escola) return;
    usuarioInteragiuRef.current = true;
    centralizarNaAreaVisivel(escola, true);
  // A centralização usa as refs correntes para preservar o mapa já montado.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolas, focoNoMapa, selecionada]);

  useEffect(() => {
    if (!reenquadrar) return;
    usuarioInteragiuRef.current = false;
    escolasEnquadradasRef.current = "";
    onVisaoAlterada(false);
    enquadrarEscolas(true);
  // enquadrarEscolas é estabilizado pelas refs do componente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reenquadrar, onVisaoAlterada]);

  useEffect(() => {
    const atualizarEnquadramento = () => enquadrarAtualRef.current();
    const observador = new ResizeObserver(atualizarEnquadramento);
    if (elementRef.current) observador.observe(elementRef.current);
    if (cabecalhoRef.current) observador.observe(cabecalhoRef.current);
    if (listaRef.current) observador.observe(listaRef.current);
    const legenda = listaRef.current?.querySelector("[data-eja-legenda-mapa]");
    if (legenda) observador.observe(legenda);
    window.addEventListener("resize", atualizarEnquadramento);
    return () => { observador.disconnect(); window.removeEventListener("resize", atualizarEnquadramento); };
  // As refs dos contêineres são objetos estáveis; suas propriedades são lidas
  // sempre que este efeito roda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolas, pronto]);

  return <div ref={elementRef} className="absolute inset-0 bg-[#dbeafe]" aria-label="Mapa das escolas" />;
}
