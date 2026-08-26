import { createClient } from "npm:@supabase/supabase-js@2";

const origemPermitida = "https://vempraeja-novo.web.app";

function corsHeaders(request: Request) {
  const origem = request.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origem === "http://localhost:3000" ? origem : origemPermitida,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function resposta(request: Request, corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: corsHeaders(request) });
}

function chavePublicaDoSupabase() {
  const chaves = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (chaves) return JSON.parse(chaves).default as string;
  return Deno.env.get("SUPABASE_ANON_KEY")!;
}

function base64Url(valor: string | ArrayBuffer) {
  const bytes = typeof valor === "string" ? new TextEncoder().encode(valor) : new Uint8Array(valor);
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function chavePrivadaGoogle() {
  const pem = Deno.env.get("GOOGLE_ANALYTICS_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!pem) throw new Error("A chave privada do Google não foi configurada.");
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const bytes = Uint8Array.from(atob(base64), (letra) => letra.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", bytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function tokenDoGoogle() {
  const email = Deno.env.get("GOOGLE_ANALYTICS_CLIENT_EMAIL");
  if (!email) throw new Error("O e-mail da conta de serviço não foi configurado.");
  const agora = Math.floor(Date.now() / 1000);
  const cabecalho = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const carga = base64Url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: agora,
    exp: agora + 3600,
  }));
  const assinatura = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", await chavePrivadaGoogle(), new TextEncoder().encode(`${cabecalho}.${carga}`));
  const jwt = `${cabecalho}.${carga}.${base64Url(assinatura)}`;
  const respostaToken = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!respostaToken.ok) {
    const detalhe = await respostaToken.text();
    throw new Error(`O Google recusou a autenticação: ${detalhe}`);
  }
  const dados = await respostaToken.json() as { access_token?: string };
  if (!dados.access_token) throw new Error("O Google não retornou um token de acesso.");
  return dados.access_token;
}

type RelatorioGoogle = { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }> };

async function relatorioGoogle(token: string, corpo: Record<string, unknown>) {
  const propriedade = Deno.env.get("GOOGLE_ANALYTICS_PROPERTY_ID");
  if (!propriedade) throw new Error("O ID da propriedade do Google Analytics não foi configurado.");
  const respostaGoogle = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propriedade}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!respostaGoogle.ok) {
    const detalhe = await respostaGoogle.text();
    throw new Error(`O Google recusou a consulta de estatísticas: ${detalhe}`);
  }
  return respostaGoogle.json() as Promise<RelatorioGoogle>;
}

function numero(relatorio: RelatorioGoogle) { return Number(relatorio.rows?.[0]?.metricValues?.[0]?.value ?? 0); }
function linhas(relatorio: RelatorioGoogle) { return (relatorio.rows ?? []).map((linha) => ({ nome: linha.dimensionValues?.[0]?.value ?? "Não informado", total: Number(linha.metricValues?.[0]?.value ?? 0) })); }

function periodoDoCorpo(corpo: unknown) {
  const dados = corpo && typeof corpo === "object" ? corpo as { inicio?: string; fim?: string } : {};
  const data = /^\d{4}-\d{2}-\d{2}$/;
  return [{ startDate: data.test(dados.inicio ?? "") ? dados.inicio : "7daysAgo", endDate: data.test(dados.fim ?? "") ? dados.fim : "today" }];
}

function consultaEvento(nome: string, dataRanges: unknown) {
  return { dateRanges: dataRanges, metrics: [{ name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: nome } } } };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return resposta(request, { erro: "Método não permitido." }, 405);
  try {
    const autorizacao = request.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, chavePublicaDoSupabase());
    const { data: { user }, error } = await supabase.auth.getUser(autorizacao.replace(/^Bearer\s+/i, ""));
    if (error || !user || user.email !== Deno.env.get("ANALYTICS_ADMIN_EMAIL")) return resposta(request, { erro: "Acesso não autorizado." }, 401);
    const corpo = await request.json().catch(() => ({}));
    const dataRanges = periodoDoCorpo(corpo);
    const token = await tokenDoGoogle();
    const [visitas, nivel, escola, cadastro, conclusao, dispositivos, paginas, horarios] = await Promise.all([
      relatorioGoogle(token, { dateRanges: dataRanges, metrics: [{ name: "totalUsers" }] }),
      relatorioGoogle(token, consultaEvento("escolheu_nivel", dataRanges)),
      relatorioGoogle(token, consultaEvento("abriu_escola", dataRanges)),
      relatorioGoogle(token, consultaEvento("iniciou_cadastro", dataRanges)),
      relatorioGoogle(token, consultaEvento("concluiu_inscricao", dataRanges)),
      relatorioGoogle(token, { dateRanges: dataRanges, dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }] }),
      relatorioGoogle(token, { dateRanges: dataRanges, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], limit: 10, orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }] }),
      relatorioGoogle(token, { dateRanges: dataRanges, dimensions: [{ name: "dateHour" }], metrics: [{ name: "activeUsers" }], limit: 48, orderBys: [{ dimension: { dimensionName: "dateHour" } }] }),
    ]);
    return resposta(request, { resumo: { visitas: numero(visitas), escolheuNivel: numero(nivel), abriuEscola: numero(escola), iniciouCadastro: numero(cadastro), concluiuInscricao: numero(conclusao) }, acessos: { dispositivos: linhas(dispositivos), paginas: linhas(paginas), horarios: linhas(horarios) } });
  } catch (erro) {
    console.error(erro);
    return resposta(request, { erro: "Não foi possível carregar as estatísticas agora." }, 500);
  }
});
