const EMAIL_ADMINISTRADOR = "admin@vempraeja-novo.app";
const CHAVE_SESSAO = "eja-admin-access-token";

type RespostaLogin = {
  access_token?: string;
  user?: { email?: string | null };
};

function configuracao() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error("A configuração do Supabase não foi encontrada.");
  }

  return { url: url.replace(/\/$/, ""), chave };
}

export async function entrarComoAdministrador(senha: string) {
  const { url, chave } = configuracao();
  const resposta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: chave, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL_ADMINISTRADOR, password: senha }),
  });

  if (!resposta.ok) return false;

  const dados = await resposta.json() as RespostaLogin;
  const email = dados.user?.email?.toLowerCase();
  if (!dados.access_token || email !== EMAIL_ADMINISTRADOR) return false;

  sessionStorage.setItem(CHAVE_SESSAO, dados.access_token);
  return true;
}

export async function administradorEstaLogado() {
  const token = sessionStorage.getItem(CHAVE_SESSAO);
  if (!token) return false;

  try {
    const { url, chave } = configuracao();
    const resposta = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: chave, Authorization: `Bearer ${token}` },
    });
    if (!resposta.ok) return false;

    const usuario = await resposta.json() as { email?: string | null };
    return usuario.email?.toLowerCase() === EMAIL_ADMINISTRADOR;
  } catch {
    return false;
  }
}

export function sairDaAreaAdministrativa() {
  sessionStorage.removeItem(CHAVE_SESSAO);
}

export function obterTokenAdministrador() {
  return sessionStorage.getItem(CHAVE_SESSAO);
}
