import type { NextRequest } from "next/server";
import { z } from "zod";
import { exigirAdministrador } from "../../../lib/server/auth";
import { criarBeneficio } from "../../../lib/server/escolas";
import { erroDaApi, json } from "../../../lib/server/http";

export async function POST(request: NextRequest) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const entrada = z.object({ nome: z.string().trim().min(2).max(100), descricao: z.string().trim().max(1000) }).parse(await request.json());
    return json(await criarBeneficio(entrada.nome, entrada.descricao), 201);
  } catch (erro) { return erroDaApi(erro); }
}
