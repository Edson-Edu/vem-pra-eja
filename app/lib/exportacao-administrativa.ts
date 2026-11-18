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

export function imprimirMetricas(dados: EstatisticasAnalytics, periodo: string) {
  const janela = window.open("", "_blank", "noopener,noreferrer");
  if (!janela) return;
  const grupos = [["Escolas", dados.encaminhamentos.escolas], ["Níveis", dados.encaminhamentos.niveis], ["Turnos", dados.encaminhamentos.turnos]] as const;
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório VemPraEJA</title><style>body{font:14px Arial;margin:36px;color:#17233b}h1{color:#075aa5}table{border-collapse:collapse;width:100%;margin:12px 0 28px}th,td{border:1px solid #ccd5df;padding:8px;text-align:left}th{background:#eef6fd}</style></head><body><h1>VemPraEJA — métricas agregadas</h1><p>${periodo}</p><p><strong>Atenção:</strong> cliques no WhatsApp representam encaminhamentos; não comprovam contato nem matrícula.</p>${grupos.map(([titulo, itens]) => `<h2>${titulo}</h2><table><tr><th>Item</th><th>Total de cliques</th></tr>${itens.map((item) => `<tr><td>${item.nome}</td><td>${item.total}</td></tr>`).join("")}</table>`).join("")}</body></html>`);
  janela.document.close(); janela.focus(); janela.print();
}
