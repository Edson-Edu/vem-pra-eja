import type { NextRequest } from "next/server";
import { z } from "zod";
import { exigirAdministrador } from "../../../lib/server/auth";
import { consultar } from "../../../lib/server/db";
import { erroDaApi, json } from "../../../lib/server/http";

const periodoSchema = z.object({ inicio: z.iso.date(), fim: z.iso.date() }).refine((valor) => valor.inicio <= valor.fim, "Período inválido.");
type Total = { nome: string; total: string };

export async function POST(request: NextRequest) {
  const acesso = await exigirAdministrador(request, true);
  if ("erro" in acesso) return json({ erro: acesso.erro }, acesso.status);
  try {
    const periodo = periodoSchema.parse(await request.json());
    const parametros = [periodo.inicio, periodo.fim];
    const filtro = "dia between $1::date and $2::date";
    const [eventos, dispositivos, paginas, horarios, escolas, niveis, turnos, dias] = await Promise.all([
      consultar<Total>(`select evento nome,sum(total)::text total from public.metricas_agregadas where ${filtro} group by evento`, parametros),
      consultar<Total>(`select dispositivo nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='visitou_site' group by dispositivo order by sum(total) desc`, parametros),
      consultar<Total>(`select coalesce(nullif(pagina,''),'Página inicial') nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='visitou_site' group by pagina order by sum(total) desc`, parametros),
      consultar<Total>(`select lpad(hora::text,2,'0')||':00' nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='visitou_site' group by hora order by hora`, parametros),
      consultar<Total>(`select escola_nome nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='clicou_whatsapp' and escola_nome<>'' group by escola_nome order by sum(total) desc`, parametros),
      consultar<Total>(`select nivel nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='clicou_whatsapp' and nivel<>'' group by nivel order by sum(total) desc`, parametros),
      consultar<Total>(`select turno nome,sum(total)::text total from public.metricas_agregadas where ${filtro} and evento='clicou_whatsapp' and turno<>'' group by turno order by sum(total) desc`, parametros),
      consultar<{ dia: string; evento: string; total: string }>(`select dia::text,evento,sum(total)::text total from public.metricas_agregadas where ${filtro} group by dia,evento order by dia`, parametros),
    ]);
    const mapa = Object.fromEntries(eventos.rows.map((item) => [item.nome, Number(item.total)]));
    const converter = (linhas: Total[]) => linhas.map((item) => ({ nome: item.nome, total: Number(item.total) }));
    return json({
      resumo: { visitas: mapa.visitou_site ?? 0, escolheuNivel: mapa.selecionou_nivel ?? 0, abriuMapa: mapa.visualizou_mapa ?? 0, abriuEscola: mapa.visualizou_escola ?? 0, chegouContato: mapa.chegou_contato ?? 0, cliquesWhatsapp: mapa.clicou_whatsapp ?? 0 },
      acessos: { dispositivos: converter(dispositivos.rows), paginas: converter(paginas.rows), horarios: converter(horarios.rows) },
      encaminhamentos: { escolas: converter(escolas.rows), niveis: converter(niveis.rows), turnos: converter(turnos.rows) },
      serie: dias.rows.map((item) => ({ dia: item.dia, evento: item.evento, total: Number(item.total) })),
    });
  } catch (erro) { return erroDaApi(erro); }
}
