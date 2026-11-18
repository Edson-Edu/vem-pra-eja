import "server-only";

import type { NextRequest } from "next/server";
import { ZodError } from "zod";

export function json(corpo: unknown, status = 200) {
  return Response.json(corpo, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export function erroDaApi(erro: unknown) {
  if (erro instanceof ZodError) return json({ erro: "Dados inválidos.", campos: erro.flatten().fieldErrors }, 400);
  console.error(erro);
  return json({ erro: "Não foi possível concluir a operação." }, 500);
}

export function origemPermitida(request: NextRequest) {
  const origem = request.headers.get("origin");
  if (!origem) return false;
  const configurada = process.env.APP_ORIGIN?.replace(/\/$/, "");
  return origem.replace(/\/$/, "") === (configurada || request.nextUrl.origin);
}

export function dispositivo(request: NextRequest) {
  const agente = request.headers.get("user-agent") ?? "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(agente) || (/Android/i.test(agente) && !/Mobile/i.test(agente))) return "tablet";
  if (/Mobile|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(agente)) return "mobile";
  return "desktop";
}

