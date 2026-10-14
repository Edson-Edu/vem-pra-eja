import { createClient } from "npm:@supabase/supabase-js@2";

const origensLocais = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const origemPublicada = Deno.env.get("SITE_ORIGIN")?.replace(/\/$/, "");
function origemEhPermitida(request: Request) {
  const origem = request.headers.get("origin")?.replace(/\/$/, "") ?? "";
  return origensLocais.has(origem) || Boolean(origemPublicada && origem === origemPublicada);
}

function corsHeaders(request: Request) {
  const origem = request.headers.get("origin")?.replace(/\/$/, "") ?? "http://localhost:3000";
  return {
    "Access-Control-Allow-Origin": origemEhPermitida(request) ? origem : "http://localhost:3000",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function resposta(request: Request, corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: corsHeaders(request) });
}

function periodo(corpo: unknown) {
  const dados = corpo && typeof corpo === "object" ? corpo as { inicio?: string; fim?: string } : {};
  const data = /^\d{4}-\d{2}-\d{2}$/;
  const hoje = new Date().toISOString().slice(0, 10);
  return {
    inicio: data.test(dados.inicio ?? "") ? dados.inicio! : hoje,
    fim: data.test(dados.fim ?? "") ? dados.fim! : hoje,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return resposta(request, { erro: "Método não permitido." }, 405);
  if (!origemEhPermitida(request)) return resposta(request, { erro: "Origem não permitida." }, 403);

  try {
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { data: { user }, error: erroDeAutenticacao } = await anon.auth.getUser(token);
    if (erroDeAutenticacao || !user) {
      return resposta(request, { erro: "Acesso não autorizado." }, 401);
    }

    const faixa = periodo(await request.json().catch(() => ({})));
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    try {
      const verificacao = await fetch(`${url}/functions/v1/verificar-retornos-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
        signal: AbortSignal.timeout(20_000),
      });
      if (!verificacao.ok) console.error("A verificação de devoluções não respondeu com sucesso.");
    } catch (erroDeVerificacao) {
      console.error("Não foi possível verificar devoluções antes do relatório:", erroDeVerificacao);
    }
    const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
    const { data, error } = await admin.rpc("estatisticas_analytics_local", { p_inicio: faixa.inicio, p_fim: faixa.fim });
    if (error) throw error;
    return resposta(request, data);
  } catch (erro) {
    console.error(erro);
    return resposta(request, { erro: "Não foi possível carregar as estatísticas agora." }, 500);
  }
});
