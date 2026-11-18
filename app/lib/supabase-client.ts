import type { Escola, Turno } from "./escolas";

export async function buscarEscolas(nivel: Turno["nivel"], id?: string | null): Promise<Escola[]> {
  const consulta = new URLSearchParams({ nivel });
  if (id) consulta.set("id", id);
  const resposta = await fetch(`/api/escolas?${consulta}`, { cache: "no-store" });
  const corpo = await resposta.json().catch(() => ({})) as { escolas?: Escola[]; erro?: string };
  if (!resposta.ok || !Array.isArray(corpo.escolas)) throw new Error(corpo.erro || "Não foi possível obter as escolas.");
  return corpo.escolas;
}
