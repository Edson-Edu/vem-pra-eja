"use client";

type EventoDoSite =
  | "visitou_pagina"
  | "escolheu_nivel"
  | "abriu_escola"
  | "iniciou_cadastro"
  | "concluiu_inscricao";

const CHAVE_VISITANTE = "eja-analytics-visitante";
const CHAVE_ULTIMA_PAGINA = "eja-analytics-ultima-pagina";
let visitanteTemporario = "";

function configuracao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && chave ? { url, chave } : null;
}

function criarUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (caractere) =>
    (Number(caractere) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(caractere) / 4).toString(16));
}

function idDoVisitante() {
  try {
    const existente = localStorage.getItem(CHAVE_VISITANTE);
    if (existente) return existente;
    const novo = criarUuid();
    localStorage.setItem(CHAVE_VISITANTE, novo);
    return novo;
  } catch {
    if (!visitanteTemporario) visitanteTemporario = criarUuid();
    return visitanteTemporario;
  }
}

function enviarEvento(evento: EventoDoSite, pagina: string, contexto: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const config = configuracao();
  if (!config) return;

  void fetch(`${config.url}/functions/v1/registrar-acesso`, {
    method: "POST",
    headers: { apikey: config.chave, "Content-Type": "application/json" },
    body: JSON.stringify({ evento, pagina, visitanteId: idDoVisitante(), contexto }),
    keepalive: true,
  }).catch(() => undefined);
}

export function registrarVisitaPagina(pagina: string) {
  const agora = Date.now();
  try {
    const anterior = JSON.parse(sessionStorage.getItem(CHAVE_ULTIMA_PAGINA) ?? "null") as { pagina?: string; instante?: number } | null;
    if (anterior?.pagina === pagina && agora - (anterior.instante ?? 0) < 1500) return;
    sessionStorage.setItem(CHAVE_ULTIMA_PAGINA, JSON.stringify({ pagina, instante: agora }));
  } catch { /* A visita ainda é registrada quando o armazenamento está indisponível. */ }
  enviarEvento("visitou_pagina", pagina);
}

/** Registra somente ações agregadas, sem nome, CPF, telefone, endereço ou e-mail. */
export function registrarEventoAnalytics(evento: Exclude<EventoDoSite, "visitou_pagina">, contexto: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  enviarEvento(evento, window.location.pathname, contexto);
}
