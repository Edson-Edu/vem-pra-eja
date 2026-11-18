import type { NextRequest } from "next/server";
import { escolasPublicas } from "../../lib/server/escolas";
import { erroDaApi, json } from "../../lib/server/http";
import { nivelSchema } from "../../lib/validacao";
import { z } from "zod";

const consultaSchema = z.object({
  nivel: nivelSchema.optional(),
  id: z.string().uuid().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const consulta = consultaSchema.parse({
      nivel: request.nextUrl.searchParams.get("nivel") || undefined,
      id: request.nextUrl.searchParams.get("id") || undefined,
    });
    return json({ escolas: await escolasPublicas(consulta.nivel, consulta.id) });
  } catch (erro) {
    return erroDaApi(erro);
  }
}
