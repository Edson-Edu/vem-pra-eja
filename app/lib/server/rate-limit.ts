import "server-only";

import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";

type Entrada = { inicio: number; total: number };
const entradas = new Map<string, Entrada>();

function ipDoPedido(request: NextRequest) {
  if (process.env.TRUST_PROXY === "true") return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "proxy-sem-ip";
  return request.headers.get("x-real-ip") || "origem-local";
}

export function dentroDoLimite(request: NextRequest, escopo: string, maximo: number, janelaMs: number) {
  const segredo = process.env.RATE_LIMIT_SECRET || "desenvolvimento-local";
  const chave = createHmac("sha256", segredo).update(`${escopo}:${ipDoPedido(request)}`).digest("hex");
  const agora = Date.now();
  const atual = entradas.get(chave);
  if (!atual || agora - atual.inicio >= janelaMs) {
    entradas.set(chave, { inicio: agora, total: 1 });
    return true;
  }
  atual.total += 1;
  if (entradas.size > 10_000) for (const [item, valor] of entradas) if (agora - valor.inicio >= janelaMs) entradas.delete(item);
  return atual.total <= maximo;
}

