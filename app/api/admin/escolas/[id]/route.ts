import type { NextRequest } from "next/server";
import { z } from "zod";
import { exigirAdministrador } from "../../../../lib/server/auth";
import { alterarAtivacao, excluirEscola } from "../../../../lib/server/escolas";
import { erroDaApi, json } from "../../../../lib/server/http";

const idSchema = z.string().uuid();

export async function PATCH(request: NextRequest, contexto: RouteContext<"/api/admin/escolas/[id]">) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const { id } = await contexto.params;
    const corpo = z.object({ ativa: z.boolean() }).parse(await request.json());
    await alterarAtivacao(idSchema.parse(id), corpo.ativa);
    return json({ ok: true });
  } catch (erro) { return erroDaApi(erro); }
}

export async function DELETE(request: NextRequest, contexto: RouteContext<"/api/admin/escolas/[id]">) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const { id } = await contexto.params;
    await excluirEscola(idSchema.parse(id));
    return json({ ok: true });
  } catch (erro) { return erroDaApi(erro); }
}
