import { createClient } from "npm:@supabase/supabase-js@2";

const origensLocais = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const origemPublicada = Deno.env.get("SITE_ORIGIN")?.replace(/\/$/, "");
const eventosPermitidos = new Set(["visitou_pagina", "escolheu_nivel", "abriu_escola", "iniciou_cadastro", "concluiu_inscricao"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function origemEhPermitida(request: Request) {
  const origem = request.headers.get("origin")?.replace(/\/$/, "") ?? "";
  return origensLocais.has(origem) || Boolean(origemPublicada && origem === origemPublicada);
}

function corsHeaders(request: Request) {
  const origem = request.headers.get("origin")?.replace(/\/$/, "") ?? "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": origemEhPermitida(request) ? origem : "http://localhost:3000",
    "Access-Control-Allow-Headers": "apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function resposta(request: Request, corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: corsHeaders(request) });
}

function dispositivo(userAgent: string) {
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) return "tablet";
  if (/Mobile|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(userAgent)) return "mobile";
  return "desktop";
}

function contextoSeguro(valor: unknown) {
  const recebido = valor && typeof valor === "object" ? valor as Record<string, unknown> : {};
  const resultado: Record<string, string> = {};
  for (const campo of ["nivel", "escola_id", "turno"]) {
    if (typeof recebido[campo] === "string") resultado[campo] = recebido[campo].slice(0, 100);
  }
  return resultado;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return resposta(request, { erro: "Método não permitido." }, 405);
  if (!origemEhPermitida(request)) return resposta(request, { erro: "Origem não permitida." }, 403);

  try {
    const corpo = await request.json() as { evento?: unknown; pagina?: unknown; visitanteId?: unknown; contexto?: unknown };
    if (typeof corpo.evento !== "string" || !eventosPermitidos.has(corpo.evento)) return resposta(request, { erro: "Evento inválido." }, 400);
    if (typeof corpo.visitanteId !== "string" || !uuid.test(corpo.visitanteId)) return resposta(request, { erro: "Identificador inválido." }, 400);
    const pagina = typeof corpo.pagina === "string" && corpo.pagina.startsWith("/") ? corpo.pagina.slice(0, 200) : "/";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { error } = await supabase.from("eventos_analytics").insert({
      evento: corpo.evento,
      visitante_id: corpo.visitanteId,
      pagina,
      dispositivo: dispositivo(request.headers.get("user-agent") ?? ""),
      contexto: contextoSeguro(corpo.contexto),
    });
    if (error) throw error;
    return resposta(request, { registrado: true }, 202);
  } catch (erro) {
    console.error(erro);
    return resposta(request, { erro: "Não foi possível registrar o acesso." }, 500);
  }
});
