import type { NextRequest } from "next/server";
import { exigirAdministrador } from "../../../lib/server/auth";
import { salvarEscola } from "../../../lib/server/escolas";
import { erroDaApi, json } from "../../../lib/server/http";
import { escolaAdministrativaSchema } from "../../../lib/validacao";

export async function POST(request: NextRequest) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const id = await salvarEscola(escolaAdministrativaSchema.parse(await request.json()));
    return json({ id }, 201);
  } catch (erro) { return erroDaApi(erro); }
}
