"use client";

import { useCallback, useEffect, useState } from "react";

const evento = "eja-acessibilidade";
export const EVENTO_DE_REPRODUCAO_DO_AUDIO = "eja-audio-reproducao";
const chaveDePersistencia = "eja-audio-ativo";
let tocador: HTMLAudioElement | null = null;
let fonteDeAudio: AudioBufferSourceNode | null = null;
let contextoDeAudio: AudioContext | null = null;
let urlDoAudio: string | null = null;
let reprodutorNativo: HTMLAudioElement | null = null;
let audioDeDesbloqueio: HTMLAudioElement | null = null;
let audioFoiDesbloqueado = false;
let desbloqueioDoAudio: Promise<boolean> = Promise.resolve(false);
let versaoDaFila = 0;
let fila = Promise.resolve();
let acessibilidadeAtiva = false;
let estadoDaReproducao = { carregando: false, tocando: false };

// WAV curto e silencioso: iniciado no gesto da pessoa para liberar a mídia
// posterior no Safari e em alguns navegadores Android.
const AUDIO_SILENCIOSO = "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA";
const TEMPO_MAXIMO_DE_RESPOSTA = 18_000;
const TEMPO_MAXIMO_DE_INICIO = 6_000;

function estaAtiva() {
  if (acessibilidadeAtiva) return true;
  try { return typeof window !== "undefined" && sessionStorage.getItem(chaveDePersistencia) === "true"; } catch { return false; }
}
function definirAtiva(valor: boolean) {
  acessibilidadeAtiva = valor;
  try { sessionStorage.setItem(chaveDePersistencia, valor ? "true" : "false"); } catch { /* armazenamento indisponível */ }
}
function avisar() { window.dispatchEvent(new Event(evento)); }
function avisarEstadoDaReproducao() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_DE_REPRODUCAO_DO_AUDIO, { detail: estadoDaReproducao }));
  }
}
function definirEstadoDaReproducao(carregando: boolean, tocando: boolean) {
  estadoDaReproducao = { carregando, tocando };
  avisarEstadoDaReproducao();
}
function marcarCarregamentoDoAudio() { definirEstadoDaReproducao(true, false); }
function marcarInicioDoAudio() { definirEstadoDaReproducao(false, true); }
function marcarFimDoAudio() { definirEstadoDaReproducao(false, false); }
function parar() {
  versaoDaFila++;
  try { fonteDeAudio?.stop(); } catch { /* A fonte já pode ter terminado. */ }
  fonteDeAudio = null;
  tocador?.pause();
  reprodutorNativo?.pause();
  audioDeDesbloqueio = null;
  try { window.speechSynthesis?.cancel(); } catch { /* síntese indisponível */ }
  if (urlDoAudio) URL.revokeObjectURL(urlDoAudio);
  tocador = null;
  urlDoAudio = null;
  fila = Promise.resolve();
  marcarFimDoAudio();
}

function obterReprodutorNativo() {
  if (reprodutorNativo) return reprodutorNativo;
  const audio = new Audio();
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  reprodutorNativo = audio;
  return audio;
}

function comPrazo<T>(promessa: Promise<T>, prazo: number, mensagem: string) {
  return new Promise<T>((resolver, rejeitar) => {
    const limite = window.setTimeout(() => rejeitar(new Error(mensagem)), prazo);
    promessa.then(
      (valor) => { window.clearTimeout(limite); resolver(valor); },
      (erro: unknown) => { window.clearTimeout(limite); rejeitar(erro); },
    );
  });
}

function encerrarAudioDeDesbloqueio() {
  if (!audioDeDesbloqueio) return;
  audioDeDesbloqueio.pause();
  audioDeDesbloqueio.currentTime = 0;
  audioDeDesbloqueio.loop = false;
  audioDeDesbloqueio = null;
}

/**
 * No celular, a mídia recebida após o fetch só pode tocar se o contexto tiver
 * sido liberado durante o toque. O botão global chama esta rotina no mesmo
 * gesto do usuário e depois o Azure pode responder sem ser bloqueado.
 */
/**
 * Deve ser chamada dentro do toque/clique real da pessoa. O WebKit do iOS
 * expira a permissão de mídia depois de uma operação assíncrona (como o fetch
 * ao Azure), por isso o contexto e o mesmo elemento HTMLAudio são liberados
 * antes de iniciar a requisição.
 */
export function prepararAudioNoGestoUsuario() {
  if (typeof window === "undefined") return;
  const navegador = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const Construtor = window.AudioContext ?? navegador.webkitAudioContext;
  if (Construtor) {
    contextoDeAudio ??= new Construtor();
    const retomar = contextoDeAudio.state === "suspended"
      ? contextoDeAudio.resume().then(() => true).catch(() => false)
      : Promise.resolve(contextoDeAudio.state === "running");

    // Em iOS, criar e iniciar uma fonte dentro do gesto é mais confiável do
    // que somente chamar resume(). A fonte é muda e dura menos de um quadro.
    try {
      const silencio = contextoDeAudio.createBuffer(1, Math.max(1, Math.floor((contextoDeAudio.sampleRate || 22050) / 20)), contextoDeAudio.sampleRate || 22050);
      const fonte = contextoDeAudio.createBufferSource();
      const ganho = contextoDeAudio.createGain();
      fonte.buffer = silencio;
      ganho.gain.value = 0;
      fonte.connect(ganho);
      ganho.connect(contextoDeAudio.destination);
      fonte.start(0);
    } catch { /* a alternativa HTMLAudio abaixo continua disponível */ }
    desbloqueioDoAudio = retomar;
  }

  if (!audioFoiDesbloqueado) {
    const audio = obterReprodutorNativo();
    // No iOS, mídia marcada como `muted` pode não liberar a reprodução
    // audível posterior. O volume quase nulo mantém a reprodução imperceptível
    // sem esconder do WebKit que o gesto autorizou áudio.
    audio.muted = false;
    audio.volume = 0.001;
    audio.loop = true;
    audio.src = AUDIO_SILENCIOSO;
    audio.load();
    audioDeDesbloqueio = audio;
    // A chamada a play acontece sincronicamente no gesto. O áudio silencioso
    // permanece ativo até o MP3 chegar para manter a autorização no WebKit.
    const liberar = audio.play()
      .then(() => true)
      .catch(() => false)
      .then((liberado) => {
        audioFoiDesbloqueado = liberado;
        return liberado;
      });
    desbloqueioDoAudio = Promise.all([desbloqueioDoAudio, liberar]).then(([contexto, elemento]) => contexto || elemento);
  }
}

async function tocarNoContexto(dados: ArrayBuffer, versao: number) {
  const contexto = contextoDeAudio;
  if (!contexto) return false;
  try {
    await desbloqueioDoAudio;
    if (contexto.state === "suspended") await contexto.resume();
    if (contexto.state !== "running") return false;
    const buffer = await comPrazo(
      contexto.decodeAudioData(dados.slice(0)),
      TEMPO_MAXIMO_DE_INICIO,
      "O navegador demorou para decodificar o áudio.",
    );
    if (versao !== versaoDaFila || !estaAtiva()) return true;
    await new Promise<void>((resolver) => {
      const fonte = contexto.createBufferSource();
      fonte.buffer = buffer;
      fonte.connect(contexto.destination);
      fonte.onended = () => {
        if (versao === versaoDaFila) marcarFimDoAudio();
        resolver();
      };
      fonteDeAudio = fonte;
      fonte.start();
      encerrarAudioDeDesbloqueio();
      marcarInicioDoAudio();
    });
    if (fonteDeAudio) fonteDeAudio = null;
    return true;
  } catch {
    return false;
  }
}

async function tocarNoElementoNativo(url: string, versao: number) {
  const audio = obterReprodutorNativo();
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
  audio.src = url;
  audio.muted = false;
  audio.volume = 1;
  audio.load();
  tocador = audio;
  try {
    await comPrazo(audio.play(), TEMPO_MAXIMO_DE_INICIO, "O navegador não iniciou o áudio.");
    audioDeDesbloqueio = null;
    marcarInicioDoAudio();
  } catch {
    marcarFimDoAudio();
    return false;
  }
  return new Promise<boolean>((resolver) => {
    const finalizar = (tocou: boolean) => {
      audio.onended = null;
      audio.onerror = null;
      if (versao === versaoDaFila) marcarFimDoAudio();
      resolver(tocou);
    };
    audio.onended = () => finalizar(versao === versaoDaFila && estaAtiva());
    audio.onerror = () => finalizar(false);
  });
}

function tocarComSinteseDoNavegador(texto: string, versao: number) {
  if (!("speechSynthesis" in window)) {
    marcarFimDoAudio();
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolver) => {
    const fala = new SpeechSynthesisUtterance(texto);
    let finalizada = false;
    let limite: number | null = null;
    const finalizar = (tocou: boolean) => {
      if (finalizada) return;
      finalizada = true;
      if (limite !== null) window.clearTimeout(limite);
      if (versao === versaoDaFila) marcarFimDoAudio();
      resolver(tocou);
    };
    fala.lang = "pt-BR";
    fala.rate = 0.92;
    fala.onstart = () => {
      if (limite !== null) window.clearTimeout(limite);
      marcarInicioDoAudio();
    };
    fala.onend = () => finalizar(versao === versaoDaFila && estaAtiva());
    fala.onerror = () => finalizar(false);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(fala);
      // Safari pode manter `speak()` pendente sem disparar erro. O prazo evita
      // que o botão permaneça em carregamento para sempre.
      limite = window.setTimeout(() => {
        try { window.speechSynthesis.cancel(); } catch { /* síntese indisponível */ }
        finalizar(false);
      }, TEMPO_MAXIMO_DE_INICIO);
    } catch { finalizar(false); }
  });
}

async function tocar(texto: string, versao: number) {
  const endpoint = process.env.NEXT_PUBLIC_AZURE_VOICE_FUNCTION_URL || (process.env.NODE_ENV === "development" ? "/api/voz" : "");
  if (!endpoint) { await tocarComSinteseDoNavegador(texto, versao); return; }
  // text/plain evita a pré-validação CORS de navegadores móveis. O corpo segue
  // sendo JSON e a Function o interpreta normalmente.
  try {
    const controlador = new AbortController();
    const limite = window.setTimeout(() => controlador.abort(), TEMPO_MAXIMO_DE_RESPOSTA);
    let resposta: Response;
    try {
      resposta = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ texto }),
        cache: "no-store",
        signal: controlador.signal,
      });
    } finally {
      window.clearTimeout(limite);
    }
    if (versao !== versaoDaFila || !estaAtiva()) {
      marcarFimDoAudio();
      return;
    }
    if (!resposta.ok) throw new Error("A função de voz não respondeu com áudio.");
    const dados = await resposta.arrayBuffer();
    if (versao !== versaoDaFila || !estaAtiva()) {
      marcarFimDoAudio();
      return;
    }
    if (await tocarNoContexto(dados, versao)) return;
    if (urlDoAudio) URL.revokeObjectURL(urlDoAudio);
    urlDoAudio = URL.createObjectURL(new Blob([dados], { type: "audio/mpeg" }));
    if (await tocarNoElementoNativo(urlDoAudio, versao)) return;
  } catch { /* usa a voz local como última alternativa */ }
  await tocarComSinteseDoNavegador(texto, versao);
}

function enfileirar(texto: string) {
  const versao = versaoDaFila;
  // É marcado antes de iniciar o fetch para bloquear toques repetidos durante
  // a resposta da Azure. O estado só é liberado no primeiro frame de áudio.
  marcarCarregamentoDoAudio();
  fila = fila.then(() => tocar(texto, versao)).catch(() => marcarFimDoAudio());
  return fila;
}

export function useAudioDescricao() {
  const [ativo, setAtivo] = useState(false);
  const [estadoDeReproducao, setEstadoDeReproducao] = useState(estadoDaReproducao);
  useEffect(() => { const atualizar = () => setAtivo(estaAtiva()); atualizar(); window.addEventListener(evento, atualizar); return () => window.removeEventListener(evento, atualizar); }, []);
  useEffect(() => {
    const atualizar = () => setEstadoDeReproducao({ ...estadoDaReproducao });
    atualizar();
    window.addEventListener(EVENTO_DE_REPRODUCAO_DO_AUDIO, atualizar);
    return () => window.removeEventListener(EVENTO_DE_REPRODUCAO_DO_AUDIO, atualizar);
  }, []);
  const alternar = useCallback(async (texto: string) => { if (estaAtiva()) { parar(); definirAtiva(false); avisar(); return; } parar(); prepararAudioNoGestoUsuario(); definirAtiva(true); avisar(); await enfileirar(texto); }, []);
  const falar = useCallback((texto: string) => estaAtiva() ? enfileirar(texto) : Promise.resolve(), []);
  const falarAgora = useCallback((texto: string) => { if (!estaAtiva()) return Promise.resolve(); parar(); prepararAudioNoGestoUsuario(); return enfileirar(texto); }, []);
  const interromper = useCallback(() => parar(), []);
  return { ativo, carregando: estadoDeReproducao.carregando, tocando: estadoDeReproducao.tocando, alternar, falar, falarAgora, interromper };
}

export function textoParaAudio(texto: string) {
  return texto
    .replace(/\bSeg\s*[-–]\s*Sex\b/gi, "segunda a sexta")
    .replace(/\bSeg\s*[-–]\s*Qui\b/gi, "segunda a quinta")
    .replace(/\bSeg\s*[-–]\s*Qua\b/gi, "segunda a quarta")
    .replace(/\bE\.?\s*B\.?\s*M\.?\b/gi, "Escola Básica Municipal")
    .replace(/\bC\.?\s*E\.?\s*J\.?\s*A\.?\b/gi, "Centro de Educação de Jovens e Adultos")
    .replace(/\bI\.?\s*F\.?\s*C\.?\b/gi, "Instituto Federal Catarinense")
    .replace(/\bSeg\b/gi, "segunda-feira").replace(/\bTer\b/gi, "terça-feira")
    .replace(/\bQua\b/gi, "quarta-feira").replace(/\bQui\b/gi, "quinta-feira")
    .replace(/\bSex\b/gi, "sexta-feira").replace(/\s+-\s+/g, " até ");
}

export function obterEstadoDaReproducao() {
  return { ...estadoDaReproducao };
}
