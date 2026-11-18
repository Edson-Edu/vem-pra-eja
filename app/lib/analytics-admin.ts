import { requisicaoAdministrativa } from "./admin-auth";

export type GrupoAnalytics = Array<{ nome: string; total: number }>;
export type EstatisticasAnalytics = {
  resumo: { visitas: number; escolheuNivel: number; abriuMapa: number; abriuEscola: number; chegouContato: number; cliquesWhatsapp: number };
  acessos: { dispositivos: GrupoAnalytics; paginas: GrupoAnalytics; horarios: GrupoAnalytics };
  encaminhamentos: { escolas: GrupoAnalytics; niveis: GrupoAnalytics; turnos: GrupoAnalytics };
  serie: Array<{ dia: string; evento: string; total: number }>;
};

export async function carregarEstatisticasAnalytics(periodo: { inicio: string; fim: string }): Promise<EstatisticasAnalytics> {
  return await requisicaoAdministrativa("/api/admin/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(periodo) }) as unknown as EstatisticasAnalytics;
}
