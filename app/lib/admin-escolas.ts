import type { Beneficio, EscolaFormulario } from "../admin/PainelAdministrativo";
import { requisicaoAdministrativa } from "./admin-auth";

type DadosAdministrativos = { catalogo: Beneficio[]; escolas: EscolaFormulario[] };

export async function carregarDadosAdministrativos(): Promise<DadosAdministrativos> {
  return await requisicaoAdministrativa("/api/admin/dados") as unknown as DadosAdministrativos;
}

export async function salvarEscolaAdministrativa(formulario: EscolaFormulario, _catalogo: Beneficio[]) {
  void _catalogo;
  return requisicaoAdministrativa("/api/admin/escolas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...formulario, id: formulario.id || null, latitude: Number(formulario.latitude), longitude: Number(formulario.longitude) }),
  });
}

export async function alterarAtivacaoEscola(id: string, ativa: boolean) {
  await requisicaoAdministrativa(`/api/admin/escolas/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativa }) });
}

export async function excluirEscolaAdministrativa(id: string) {
  await requisicaoAdministrativa(`/api/admin/escolas/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function criarBeneficioAdministrativo(nome: string, descricao: string) {
  return await requisicaoAdministrativa("/api/admin/beneficios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, descricao }) }) as Beneficio;
}

export async function excluirBeneficioAdministrativo(id: string) {
  await requisicaoAdministrativa(`/api/admin/beneficios/${encodeURIComponent(id)}`, { method: "DELETE" });
}
