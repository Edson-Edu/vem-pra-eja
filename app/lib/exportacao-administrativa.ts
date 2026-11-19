"use client";

import type { EstatisticasAnalytics } from "./analytics-admin";

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement("a");
  link.href = url; link.download = nome; link.click();
  URL.revokeObjectURL(url);
}

function csv(valor: string | number) { return `"${String(valor).replaceAll('"', '""')}"`; }

export function exportarMetricasCsv(dados: EstatisticasAnalytics, periodo: string) {
  const linhas: Array<Array<string | number>> = [["Período", "Categoria", "Item", "Quantidade"]];
  Object.entries(dados.resumo).forEach(([nome, total]) => linhas.push([periodo, "Funil", nome, total]));
  dados.acessos.dispositivos.forEach((item) => linhas.push([periodo, "Dispositivo", item.nome, item.total]));
  dados.acessos.paginas.forEach((item) => linhas.push([periodo, "Página", item.nome, item.total]));
  dados.encaminhamentos.escolas.forEach((item) => linhas.push([periodo, "Clique no WhatsApp por escola", item.nome, item.total]));
  dados.encaminhamentos.niveis.forEach((item) => linhas.push([periodo, "Clique no WhatsApp por nível", item.nome, item.total]));
  dados.encaminhamentos.turnos.forEach((item) => linhas.push([periodo, "Clique no WhatsApp por turno", item.nome, item.total]));
  baixar(`metricas-vempraeja-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${linhas.map((linha) => linha.map(csv).join(";")).join("\n")}`, "text/csv;charset=utf-8");
}
