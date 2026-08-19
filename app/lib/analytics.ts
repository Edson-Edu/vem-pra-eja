"use client";

import { sendGAEvent } from "@next/third-parties/google";

const ID_DE_EXEMPLO = "G-SEU_CODIGO_AQUI";

type EventoDoSite =
  | "escolheu_nivel"
  | "abriu_escola"
  | "iniciou_cadastro"
  | "concluiu_inscricao";

/**
 * Registra apenas ações agregadas. Nunca envie nome, CPF, telefone ou e-mail
 * para o Google Analytics.
 */
export function registrarEventoAnalytics(evento: EventoDoSite, parametros: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const id = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  if (!id || id === ID_DE_EXEMPLO) return;
  sendGAEvent("event", evento, parametros);
}

