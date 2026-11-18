import type { NextRequest } from "next/server";
import { consultar } from "../../lib/server/db";
import { dispositivo, erroDaApi, json, origemPermitida } from "../../lib/server/http";
import { dentroDoLimite } from "../../lib/server/rate-limit";
import { eventoAnalyticsSchema } from "../../lib/validacao";

export async function POST(request: NextRequest) {
  if (!origemPermitida(request)) return json({ erro: "Origem não permitida." }, 403);
  if (!dentroDoLimite(request, "analytics", 120, 60_000)) return json({ erro: "Limite temporário atingido." }, 429);
  try {
    const entrada = eventoAnalyticsSchema.parse(await request.json());
    const escola = entrada.contexto.escolaId ? (await consultar<{ id: string; nome: string }>("select id,nome from public.escolas where id=$1 and ativa is true", [entrada.contexto.escolaId])).rows[0] : null;
    await consultar(
      `insert into public.metricas_agregadas (dia,hora,evento,escola_id,escola_nome,nivel,turno,pagina,dispositivo,total)
       values ((now() at time zone 'America/Sao_Paulo')::date, extract(hour from now() at time zone 'America/Sao_Paulo')::smallint,$1,$2,$3,$4,$5,$6,$7,1)
       on conflict (dia,hora,evento,escola_id,escola_nome,nivel,turno,pagina,dispositivo)
       do update set total=public.metricas_agregadas.total+1, atualizado_em=now()`,
      [entrada.evento, escola?.id ?? "", escola?.nome ?? "", entrada.contexto.nivel ?? "", entrada.contexto.turno ?? "", entrada.pagina, dispositivo(request)],
    );
    return json({ ok: true }, 202);
  } catch (erro) { return erroDaApi(erro); }
}
