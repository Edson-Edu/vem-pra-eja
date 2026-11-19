import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { autenticar, COOKIE_SESSAO, criarSessao, limparFalhasDeLogin, loginEstaLiberado, registrarFalhaDeLogin } from "../../../lib/server/auth";
import { erroDaApi, origemPermitida } from "../../../lib/server/http";
import { loginSchema } from "../../../lib/validacao";

export async function POST(request: NextRequest) {
  try {
    if (!origemPermitida(request)) return NextResponse.json({ erro: "Origem não permitida." }, { status: 403 });
    const entrada = loginSchema.parse(await request.json());
    const limite = await loginEstaLiberado(request, entrada.email);
    if (!limite.liberado) return NextResponse.json({ erro: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
    const administrador = await autenticar(entrada.email, entrada.senha);
    if (!administrador) {
      await registrarFalhaDeLogin(limite.chave);
      return NextResponse.json({ erro: "Usuário ou senha inválidos." }, { status: 401 });
    }
    await limparFalhasDeLogin(limite.chave);
    const sessao = await criarSessao(administrador.id);
    const resposta = NextResponse.json({ email: administrador.email, csrfToken: sessao.csrfToken });
    resposta.cookies.set(COOKIE_SESSAO, sessao.token, {
      httpOnly: true,
      secure: process.env.APP_ORIGIN?.startsWith("https://") ?? process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: sessao.expiraEm,
    });
    return resposta;
  } catch (erro) {
    return erroDaApi(erro);
  }
}
