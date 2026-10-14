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

export async function entrarComoAdministrador(email: string, senha: string) {
  const { url, chave } = configuracao();
  const resposta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: chave, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password: senha }),
  });

  if (!resposta.ok) return false;

  const dados = await resposta.json() as RespostaLogin;
  if (!dados.access_token || !dados.user?.email) return false;

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
    return Boolean(usuario.email);
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
