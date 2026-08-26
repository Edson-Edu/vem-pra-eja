import type { InscricaoAdministrativa } from "./admin-escolas";

type LinhaRelatorio = { categoria: string; item: string; total: number };

function textoSeguro(valor: unknown) {
  const texto = String(valor ?? "");
  return /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
}

function csv(valor: unknown) {
  return `"${textoSeguro(valor).replace(/"/g, '""')}"`;
}

function html(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dataArquivo() {
  return new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
}

function dataVisivel(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Data não informada" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function baixar(nome: string, cabecalho: string[], linhas: Array<Array<string | number>>) {
  const conteudo = "\uFEFF" + [cabecalho, ...linhas].map((linha) => linha.map(csv).join(";")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function abrirImpressao(titulo: string, periodo: string, conteudo: string) {
  const janela = window.open("", "_blank");
  if (!janela) {
    window.alert("Permita a abertura de nova janela para visualizar e salvar o PDF.");
    return;
  }
  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${html(titulo)}</title><style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; } body { color: #1e293b; font: 12px Arial, sans-serif; margin: 0; }
    h1 { color: #0257a0; font-size: 24px; margin: 0 0 5px; } h2 { color: #0257a0; font-size: 16px; margin: 28px 0 10px; }
    .meta { color: #475569; margin: 0 0 4px; } table { border-collapse: collapse; width: 100%; margin-top: 14px; }
    th { background: #e6f0fa; color: #0257a0; text-align: left; } th, td { border: 1px solid #d6e8fa; padding: 8px; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; } .vazio { color: #64748b; padding: 24px 0; }
    .rodape { border-top: 1px solid #d6e8fa; color: #64748b; font-size: 10px; margin-top: 28px; padding-top: 8px; }
  </style></head><body><h1>${html(titulo)}</h1><p class="meta"><strong>Período:</strong> ${html(periodo)}</p><p class="meta"><strong>Gerado em:</strong> ${html(new Date().toLocaleString("pt-BR"))}</p>${conteudo}<p class="rodape">Vem pra EJA — documento administrativo.</p></body></html>`);
  janela.document.close();
  janela.focus();
  window.setTimeout(() => janela.print(), 250);
}

export function exportarInscricoesCsv(inscricoes: InscricaoAdministrativa[], periodo: string) {
  baixar(`inscricoes-vem-pra-eja-${dataArquivo()}.csv`, ["Período", "Data", "Nome", "Cidade", "Bairro", "Escola", "Nível", "Turno", "E-mail"], inscricoes.map((item) => [periodo, dataVisivel(item.criadaEm), item.nome, item.cidade, item.bairro, item.escola, item.nivel, item.turno, item.email]));
}

export function visualizarInscricoesPdf(inscricoes: InscricaoAdministrativa[], periodo: string) {
  const linhas = inscricoes.map((item) => `<tr><td>${html(dataVisivel(item.criadaEm))}</td><td>${html(item.nome)}</td><td>${html(item.cidade)}</td><td>${html(item.bairro || "—")}</td><td>${html(item.escola)}</td><td>${html(item.nivel)}</td><td>${html(item.turno)}</td><td>${html(item.email || "—")}</td></tr>`).join("");
  abrirImpressao("Lista de inscrições", periodo, inscricoes.length ? `<table><thead><tr><th>Data</th><th>Nome</th><th>Cidade</th><th>Bairro</th><th>Escola</th><th>Nível</th><th>Turno</th><th>E-mail</th></tr></thead><tbody>${linhas}</tbody></table>` : "<p class=\"vazio\">Nenhuma inscrição encontrada com os filtros escolhidos.</p>");
}

export function exportarRelatorioCsv(linhas: LinhaRelatorio[], periodo: string) {
  baixar(`relatorio-inscricoes-vem-pra-eja-${dataArquivo()}.csv`, ["Período", "Categoria", "Item", "Quantidade de inscrições"], linhas.map((item) => [periodo, item.categoria, item.item, item.total]));
}

export function visualizarRelatorioPdf(linhas: LinhaRelatorio[], periodo: string) {
  const categorias = [...new Set(linhas.map((linha) => linha.categoria))];
  const secoes = categorias.map((categoria) => {
    const itens = linhas.filter((linha) => linha.categoria === categoria).map((linha) => `<tr><td>${html(linha.item)}</td><td>${html(linha.total)}</td></tr>`).join("");
    return `<h2>${html(categoria)}</h2><table><thead><tr><th>Item</th><th>Inscrições</th></tr></thead><tbody>${itens}</tbody></table>`;
  }).join("");
  abrirImpressao("Relatório de inscrições", periodo, secoes || "<p class=\"vazio\">Nenhum dado encontrado com os filtros escolhidos.</p>");
}
