let csrfToken = "";

type RespostaSessao = { autenticado?: boolean; csrfToken?: string; erro?: string };

async function lerResposta(resposta: Response) {
  const corpo = await resposta.json().catch(() => ({})) as RespostaSessao;
  if (!resposta.ok) throw new Error(corpo.erro || "Não foi possível concluir a operação.");
  if (corpo.csrfToken) csrfToken = corpo.csrfToken;
  return corpo;
}

export async function entrarComoAdministrador(email: string, senha: string) {
  const resposta = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (resposta.status === 401) return false;
  await lerResposta(resposta);
  return true;
}

export async function administradorEstaLogado() {
  const resposta = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
  if (!resposta.ok) { csrfToken = ""; return false; }
  const corpo = await lerResposta(resposta);
  return corpo.autenticado === true;
}

export async function sairDaAreaAdministrativa() {
  if (csrfToken) await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin", headers: { "X-CSRF-Token": csrfToken } }).catch(() => undefined);
  csrfToken = "";
}

export async function requisicaoAdministrativa(caminho: string, opcoes: RequestInit = {}) {
  if (!csrfToken) {
    const autenticado = await administradorEstaLogado();
    if (!autenticado) throw new Error("Sua sessão administrativa expirou. Entre novamente.");
  }
  const headers = new Headers(opcoes.headers);
  if (opcoes.method && opcoes.method !== "GET") headers.set("X-CSRF-Token", csrfToken);
  const resposta = await fetch(caminho, { ...opcoes, headers, credentials: "same-origin", cache: "no-store" });
  const corpo = await resposta.json().catch(() => ({})) as Record<string, unknown>;
  if (resposta.status === 401) csrfToken = "";
  if (!resposta.ok) throw new Error(typeof corpo.erro === "string" ? corpo.erro : "Não foi possível concluir a operação.");
  return corpo;
}
