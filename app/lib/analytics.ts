"use client";

export type EventoDoSite = "visitou_site" | "selecionou_nivel" | "visualizou_mapa" | "visualizou_escola" | "chegou_contato" | "clicou_whatsapp";
type Contexto = { escolaId?: string; nivel?: "Ensino Fundamental" | "Ensino Médio"; turno?: string };
const CHAVE_DEDUPLICACAO = "eja-metricas-sessao";

function chave(evento: EventoDoSite, pagina: string, contexto: Contexto) {
  return `${evento}|${pagina}|${contexto.escolaId ?? ""}|${contexto.nivel ?? ""}|${contexto.turno ?? ""}`;
}

export function registrarEventoAnalytics(evento: EventoDoSite, contexto: Contexto = {}, repetir = false) {
  if (typeof window === "undefined") return;
  const pagina = window.location.pathname;
  if (!repetir) {
    try {
      const anteriores = new Set(JSON.parse(sessionStorage.getItem(CHAVE_DEDUPLICACAO) ?? "[]") as string[]);
      const atual = chave(evento, pagina, contexto);
      if (anteriores.has(atual)) return;
      anteriores.add(atual);
      sessionStorage.setItem(CHAVE_DEDUPLICACAO, JSON.stringify([...anteriores].slice(-100)));
    } catch { /* Métricas não podem impedir a navegação. */ }
  }
  void fetch("/api/analytics", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evento, pagina, contexto }), keepalive: true }).catch(() => undefined);
}

export function registrarVisitaPagina(_pagina: string) {
  void _pagina;
  registrarEventoAnalytics("visitou_site");
}
