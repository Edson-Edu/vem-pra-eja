import type { NextRequest } from "next/server";
import { exigirAdministrador } from "../../../lib/server/auth";
import { dadosAdministrativos } from "../../../lib/server/escolas";
import { erroDaApi, json } from "../../../lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const acesso = await exigirAdministrador(request);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try { return json(await dadosAdministrativos()); } catch (erro) { return erroDaApi(erro); }
}
