import { createClient } from "npm:@supabase/supabase-js@2";

const origensLocais = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const origemPublicada = Deno.env.get("SITE_ORIGIN")?.replace(/\/$/, "");
const emailAdministrador = Deno.env.get("ANALYTICS_ADMIN_EMAIL") ?? "admin@vempraeja-novo.app";

function origemEhPermitida(request: Request) {
  const origem = request.headers.get("origin")?.replace(/\/$/, "") ?? "";
  return origensLocais.has(origem) || Boolean(origemPublicada && origem === origemPublicada);
}

function headers(request: Request) {
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
  return new Response(JSON.stringify(corpo), { status, headers: headers(request) });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: headers(request) });
  if (request.method !== "POST") return resposta(request, { erro: "Método não permitido." }, 405);
  if (!origemEhPermitida(request)) return resposta(request, { erro: "Origem não permitida." }, 403);

  try {
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { data: { user }, error: erroDeAutenticacao } = await anon.auth.getUser(token);
    if (erroDeAutenticacao || !user || user.email?.toLowerCase() !== emailAdministrador.toLowerCase()) {
      return resposta(request, { erro: "Acesso não autorizado." }, 401);
    }

    const corpo = await request.json().catch(() => ({})) as { notificacaoId?: unknown; novoEmail?: unknown };
    const notificacaoId = typeof corpo.notificacaoId === "string" && /^\d+$/.test(corpo.notificacaoId) ? corpo.notificacaoId : "";
    const novoEmail = typeof corpo.novoEmail === "string" ? corpo.novoEmail.trim().toLowerCase() : "";
    if (!notificacaoId || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(novoEmail)) {
      return resposta(request, { erro: "Informe um endereço de e-mail válido." }, 400);
    }

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: notificacao, error: erroNotificacao } = await admin.from("notificacoes_email").select("inscricao_id").eq("id", notificacaoId).single();
    if (erroNotificacao || !notificacao) return resposta(request, { erro: "O envio não foi encontrado." }, 404);

    const { data: inscricao, error: erroInscricao } = await admin.from("inscricoes").select("*").eq("id", notificacao.inscricao_id).single();
    if (erroInscricao || !inscricao?.escola_id) return resposta(request, { erro: "A inscrição original não foi encontrada." }, 404);

    const { error: erroAtualizacao } = await admin.from("escolas").update({ email_contato: novoEmail, updated_at: new Date().toISOString() }).eq("id", inscricao.escola_id);
    if (erroAtualizacao) throw erroAtualizacao;
    await admin.from("notificacoes_email").update({ status: "na_fila", erro: null, destinatario_email: novoEmail, atualizado_em: new Date().toISOString() }).eq("id", notificacaoId);

    const envio = await fetch(`${url}/functions/v1/notificar-inscricao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "UPDATE", table: "inscricoes", record: inscricao }),
    });
    if (!envio.ok) return resposta(request, { erro: "O endereço foi corrigido, mas o reenvio falhou. Consulte o novo motivo no painel." }, 502);
    return resposta(request, { reenviado: true });
  } catch (erro) {
    console.error(erro);
    return resposta(request, { erro: "Não foi possível corrigir e reenviar o e-mail." }, 500);
  }
});
