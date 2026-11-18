import type { NextRequest } from "next/server";
import { z } from "zod";
import { exigirAdministrador } from "../../../../lib/server/auth";
import { excluirBeneficio } from "../../../../lib/server/escolas";
import { erroDaApi, json } from "../../../../lib/server/http";

export async function DELETE(request: NextRequest, contexto: RouteContext<"/api/admin/beneficios/[id]">) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const { id } = await contexto.params;
    await excluirBeneficio(z.string().uuid().parse(id));
    return json({ ok: true });
  } catch (erro) { return erroDaApi(erro); }
}
