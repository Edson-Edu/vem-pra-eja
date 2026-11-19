import type { EstatisticasAnalytics, GrupoAnalytics } from "../lib/analytics-admin";

const indicadores = [
  ["Visitas ao site", "visitas"],
  ["Nível selecionado", "escolheuNivel"],
  ["Mapa visualizado", "abriuMapa"],
  ["Escola visualizada", "abriuEscola"],
  ["Chegaram ao contato", "chegouContato"],
  ["Cliques no WhatsApp", "cliquesWhatsapp"],
] as const;

export default function RelatorioImpressao({ dados, periodo, geradoEm }: { dados: EstatisticasAnalytics; periodo: string; geradoEm: string }) {
  const possuiDados = Object.values(dados.resumo).some((total) => total > 0)
    || dados.acessos.dispositivos.length > 0
    || dados.acessos.paginas.length > 0
    || dados.encaminhamentos.escolas.length > 0;

  return (
    <article data-relatorio-impressao>
      <header className="relatorio-impressao-cabecalho">
        <p className="relatorio-impressao-marca">VEMPRAEJA</p>
        <h1>Relatório de métricas agregadas</h1>
        <dl>
          <div><dt>Período</dt><dd>{periodo}</dd></div>
          <div><dt>Gerado em</dt><dd>{geradoEm || "Data de geração indisponível"}</dd></div>
        </dl>
        <p>Os números representam interações agregadas. O relatório não contém nome, CPF, telefone, e-mail, IP ou identificador de visitante.</p>
      </header>

      {!possuiDados && <p className="relatorio-impressao-vazio">Nenhuma interação agregada foi registrada no período selecionado.</p>}

      <section className="relatorio-impressao-secao">
        <h2>Avanço pelas etapas</h2>
        <div className="relatorio-impressao-indicadores">
          {indicadores.map(([nome, chave]) => (
            <div key={chave}>
              <strong>{dados.resumo[chave].toLocaleString("pt-BR")}</strong>
              <span>{nome}</span>
            </div>
          ))}
        </div>
      </section>

      <Tabela titulo="Acessos por dispositivo" dados={dados.acessos.dispositivos} coluna="Visitas" />
      <Tabela titulo="Acessos por horário" dados={dados.acessos.horarios} coluna="Visitas" />
      <Tabela titulo="Páginas acessadas" dados={dados.acessos.paginas} coluna="Visitas" />
      <Tabela titulo="Encaminhamentos por escola" dados={dados.encaminhamentos.escolas} coluna="Cliques" />
      <Tabela titulo="Encaminhamentos por nível" dados={dados.encaminhamentos.niveis} coluna="Cliques" />
      <Tabela titulo="Encaminhamentos por turno" dados={dados.encaminhamentos.turnos} coluna="Cliques" />

      <footer>
        Um clique no WhatsApp indica apenas que o canal foi aberto. Não comprova conversa, matrícula ou disponibilidade de vaga.
      </footer>
    </article>
  );
}

function Tabela({ titulo, dados, coluna }: { titulo: string; dados: GrupoAnalytics; coluna: string }) {
  const maximo = Math.max(1, ...dados.map((item) => item.total));
  return (
    <section className="relatorio-impressao-secao relatorio-impressao-tabela">
      <h2>{titulo}</h2>
      {dados.length ? (
        <table>
          <thead><tr><th>Item</th><th>Distribuição</th><th>{coluna}</th></tr></thead>
          <tbody>
            {dados.map((item) => (
              <tr key={`${titulo}-${item.nome}`}>
                <td>{item.nome || "Não informado"}</td>
                <td><span className="relatorio-impressao-barra"><i style={{ width: `${item.total / maximo * 100}%` }} /></span></td>
                <td>{item.total.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="relatorio-impressao-sem-linhas">Sem registros para esta categoria no período.</p>}
    </section>
  );
}
