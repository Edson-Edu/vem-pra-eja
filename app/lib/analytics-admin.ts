import { obterTokenAdministrador } from "./admin-auth";

export type EstatisticasAnalytics = {
  resumo: {
    visitas: number;
    escolheuNivel: number;
    abriuEscola: number;
    iniciouCadastro: number;
    concluiuInscricao: number;
  };
  acessos: {
    dispositivos: Array<{ nome: string; total: number }>;
    paginas: Array<{ nome: string; total: number }>;
    horarios: Array<{ nome: string; total: number }>;
  };
};

export async function carregarEstatisticasAnalytics(periodo: { inicio: string; fim: string }): Promise<EstatisticasAnalytics> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = obterTokenAdministrador();
  if (!url || !chave || !token) throw new Error("Sua sessão administrativa expirou. Entre novamente.");

  const resposta = await fetch(`${url}/functions/v1/analytics-admin`, {
    method: "POST",
    headers: { apikey: chave, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(periodo),
  });
  const texto = await resposta.text();
  let corpo: EstatisticasAnalytics | { erro?: string } = {};
  try { corpo = texto ? JSON.parse(texto) as EstatisticasAnalytics | { erro?: string } : {}; } catch { /* erro abaixo */ }
  if (!resposta.ok) {
    const erro = "erro" in corpo ? corpo.erro : "";
    throw new Error(erro || "Não foi possível consultar os dados de acesso.");
  }
  if (!("resumo" in corpo) || !("acessos" in corpo)) throw new Error("O serviço de estatísticas retornou uma resposta inesperada.");
  return corpo;
}
