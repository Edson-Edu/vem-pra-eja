import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COOKIE_SESSAO, exigirAdministrador, revogarSessao } from "../../../lib/server/auth";

export async function POST(request: NextRequest) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return NextResponse.json({ erro: acesso.erro }, { status: acesso.status });
  await revogarSessao(request);
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_SESSAO, "", { httpOnly: true, sameSite: "strict", secure: process.env.APP_ORIGIN?.startsWith("https://") ?? process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return resposta;
}
