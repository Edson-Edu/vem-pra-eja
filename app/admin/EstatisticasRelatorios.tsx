"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardEdit, Download, Eye, FileText, ListChecks, Mail, MailWarning, Play, School } from "lucide-react";
import { carregarEstatisticasAnalytics, type EstatisticasAnalytics } from "../lib/analytics-admin";
import { carregarInscricoesAdministrativas, type InscricaoAdministrativa } from "../lib/admin-escolas";
import { exportarInscricoesCsv, exportarRelatorioCsv, visualizarInscricoesPdf, visualizarRelatorioPdf } from "../lib/exportacao-administrativa";
import RetrospectivaAcessos from "./RetrospectivaAcessos";

type Aba = "resumo" | "acessos" | "inscricoes" | "relatorios" | "emails";
type Periodo = "Hoje" | "Últimos 7 dias" | "Mês" | "Personalizado";
type Linha = { nome: string; total: number };

const abas: Array<{ id: Aba; titulo: string }> = [
  { id: "resumo", titulo: "Resumo" }, { id: "acessos", titulo: "Acessos" }, { id: "inscricoes", titulo: "Inscrições" }, { id: "relatorios", titulo: "Relatórios" }, { id: "emails", titulo: "E-mails" },
];
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-8px_rgba(2,87,160,0.12)]";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <section className={[card, className].join(" ")}>{children}</section>; }
function Titulo({ children }: { children: React.ReactNode }) { return <h2 className="text-base font-black text-[#0257a0]">{children}</h2>; }
function EmCalculo() { return <span className="text-2xl font-black text-slate-500">A calcular</span>; }

function faixa(periodo: Periodo, inicio: string, fim: string) {
  const agora = new Date();
  const iso = (data: Date) => data.toISOString().slice(0, 10);
  if (periodo === "Hoje") return { inicio: iso(agora), fim: iso(agora) };
  if (periodo === "Últimos 7 dias") { const desde = new Date(agora); desde.setDate(agora.getDate() - 6); return { inicio: iso(desde), fim: iso(agora) }; }
  if (periodo === "Mês") return { inicio: agora.getFullYear() + "-" + String(agora.getMonth() + 1).padStart(2, "0") + "-01", fim: iso(agora) };
  return inicio && fim ? { inicio, fim } : null;
}

function Cartao({ titulo, texto, icone: Icon, valor, carregando, alerta = false }: { titulo: string; texto: string; icone: typeof Eye; valor?: number; carregando: boolean; alerta?: boolean }) {
  const cor = alerta ? "text-red-600" : "text-[#008bff]";
  return <Card><span className={["grid size-9 place-items-center rounded-xl", alerta ? "bg-red-50" : "bg-[#e6f0fa]", cor].join(" ")}><Icon className="size-5" /></span><div className="mt-4">{valor === undefined ? (carregando ? <span className="text-2xl font-black text-slate-400">…</span> : <EmCalculo />) : <span className={["text-2xl font-black", alerta ? "text-red-600" : "text-[#1e293b]"].join(" ")}>{valor.toLocaleString("pt-BR")}</span>}<p className={["mt-1 text-sm font-black", alerta ? "text-red-600" : "text-[#1e293b]"].join(" ")}>{titulo}</p><p className="mt-1 text-xs leading-5 text-slate-500">{texto}</p></div></Card>;
}

function Resumo({ dados, carregando, erro }: { dados: EstatisticasAnalytics | null; carregando: boolean; erro: string }) {
  const r = dados?.resumo;
  const cartoes = [
    { titulo: "Pessoas que entraram no site", texto: "Pessoas únicas no Vem pra EJA durante o período.", icone: Eye, valor: r?.visitas },
    { titulo: "Pessoas que escolheram um nível", texto: "Pessoas únicas que avançaram após escolher Fundamental ou Médio.", icone: ListChecks, valor: r?.escolheuNivel },
    { titulo: "Pessoas que abriram uma escola", texto: "Pessoas únicas que abriram os detalhes de uma escola.", icone: School, valor: r?.abriuEscola },
    { titulo: "Pessoas que começaram a inscrição", texto: "Pessoas únicas que chegaram ao formulário de inscrição.", icone: ClipboardEdit, valor: r?.iniciouCadastro },
    { titulo: "Pessoas que enviaram a inscrição", texto: "Pessoas únicas que clicaram em enviar o formulário.", icone: CheckCircle2, valor: r?.concluiuInscricao },
    { titulo: "E-mails enviados para as escolas", texto: "Será calculado quando o serviço de e-mail confirmar cada envio.", icone: Mail, valor: undefined },
    { titulo: "E-mails que precisam de atenção", texto: "Será calculado quando houver retorno de falha do serviço de e-mail.", icone: MailWarning, valor: undefined, alerta: true },
  ];
  const etapas = [["Entraram no site", r?.visitas], ["Escolheram um nível", r?.escolheuNivel], ["Abriram uma escola", r?.abriuEscola], ["Começaram a inscrição", r?.iniciouCadastro], ["Enviaram a inscrição", r?.concluiuInscricao]] as const;
  const maior = Math.max(...etapas.map(([, valor]) => valor ?? 0), 1);
  return <div className="space-y-6">{erro && <Card className="border-red-200 bg-red-50"><p className="font-bold text-red-700">Não foi possível atualizar os acessos: {erro}</p><p className="mt-1 text-sm text-red-600">Confira se a Edge Function está publicada e se “Verify JWT with legacy secret” está desligado.</p></Card>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cartoes.map((item) => <Cartao key={item.titulo} {...item} carregando={carregando} />)}</div><Card><Titulo>Caminho das pessoas no site</Titulo><p className="mt-1 text-sm text-slate-500">Mostra em qual etapa as pessoas seguiram ou pararam no período escolhido.</p><div className="mt-6 space-y-4">{etapas.map(([nome, valor]) => <div key={nome}><div className="flex justify-between gap-4 text-sm"><span className="font-bold text-[#1e293b]">{nome}</span><span className="font-black text-[#0257a0]">{carregando ? "…" : (valor ?? 0).toLocaleString("pt-BR")}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6f0fa]"><div className="h-full rounded-full bg-[#0257a0]" style={{ width: String(((valor ?? 0) / maior) * 100) + "%" }} /></div></div>)}</div></Card></div>;
}

function Ranking({ titulo, descricao, dados, formatar }: { titulo: string; descricao: string; dados: Linha[]; formatar?: (nome: string) => string }) {
  const maior = Math.max(...dados.map((item) => item.total), 1);
  return <Card><Titulo>{titulo}</Titulo><p className="mt-1 text-sm leading-6 text-slate-500">{descricao}</p>{dados.length ? <ol className="mt-4 space-y-4">{dados.map((item) => <li key={item.nome}><div className="flex items-center justify-between gap-4 text-sm"><span className="truncate font-bold text-[#1e293b]">{formatar ? formatar(item.nome) : item.nome}</span><span className="shrink-0 font-black text-[#0257a0]">{item.total.toLocaleString("pt-BR")}</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6f0fa]"><div className="h-full rounded-full bg-[#008bff]" style={{ width: String((item.total / maior) * 100) + "%" }} /></div></li>)}</ol> : <p className="mt-6 text-sm text-slate-500">Ainda não há dados neste período.</p>}</Card>;
}

function agruparHoras(linhas: Linha[]) {
  const horas = new Map<string, number>();
  linhas.forEach((linha) => {
    const nome = linha.nome.slice(-2);
    const hora = /^[0-9]{2}$/.test(nome) ? nome + "h" : linha.nome;
    horas.set(hora, (horas.get(hora) ?? 0) + linha.total);
  });
  return [...horas].map(([nome, total]) => ({ nome, total })).sort((a, b) => Number(a.nome.slice(0, 2)) - Number(b.nome.slice(0, 2)));
}

function GraficoDeColunas({ dados }: { dados: Linha[] }) {
  const maior = Math.max(...dados.map((item) => item.total), 1);
  return <Card><Titulo>Gráfico de acessos por horário</Titulo><p className="mt-1 text-sm leading-6 text-slate-500">As colunas mais altas indicam os horários mais acessados.</p>{dados.length ? <div className="mt-7 flex h-64 items-end gap-2 border-b border-l border-slate-200 px-3 pt-4">{dados.map((item) => <div key={item.nome} className="flex h-full min-w-8 flex-1 flex-col justify-end text-center"><span className="mb-2 text-xs font-black text-[#0257a0]">{item.total}</span><div className="min-h-1 rounded-t-md bg-[#008bff] transition-all" style={{ height: String(Math.max((item.total / maior) * 100, 2)) + "%" }} /><span className="mt-2 text-xs font-bold text-slate-500">{item.nome}</span></div>)}</div> : <p className="mt-6 text-sm text-slate-500">Ainda não há dados suficientes para montar este gráfico.</p>}</Card>;
}

function GraficoCircular({ dados }: { dados: Linha[] }) {
  const cores = ["#008BFF", "#0257A0", "#4E8AFB", "#07AA43", "#8B5CF6"];
  const total = dados.reduce((soma, item) => soma + item.total, 0);
  let inicio = 0;
  const segmentos = dados.map((item, indice) => {
    const fim = inicio + (total ? (item.total / total) * 100 : 0);
    const trecho = cores[indice % cores.length] + " " + inicio + "% " + fim + "%";
    inicio = fim;
    return trecho;
  });
  return <Card><Titulo>Gráfico de dispositivos</Titulo><p className="mt-1 text-sm leading-6 text-slate-500">Distribuição dos aparelhos usados para acessar o site.</p>{dados.length ? <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start"><div className="relative grid size-44 shrink-0 place-items-center rounded-full" style={{ backgroundImage: "conic-gradient(" + segmentos.join(", ") + ")" }}><div className="grid size-28 place-items-center rounded-full bg-white text-center"><strong className="text-2xl text-[#0257a0]">{total}</strong><span className="text-xs text-slate-500">acessos</span></div></div><ul className="w-full space-y-3">{dados.map((item, indice) => <li key={item.nome} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-bold text-[#1e293b]"><i className="size-3 rounded-full" style={{ backgroundColor: cores[indice % cores.length] }} />{item.nome}</span><span className="font-black text-[#0257a0]">{item.total} ({Math.round((item.total / total) * 100)}%)</span></li>)}</ul></div> : <p className="mt-6 text-sm text-slate-500">Ainda não há dados suficientes para montar este gráfico.</p>}</Card>;
}

function Acessos({ dados, carregando, erro }: { dados: EstatisticasAnalytics | null; carregando: boolean; erro: string }) {
  if (carregando) return <Card><p className="font-bold text-[#0257a0]">Carregando dados de acesso…</p></Card>;
  if (erro) return <Card className="border-red-200 bg-red-50"><p className="font-bold text-red-700">Os dados de acesso ainda não puderam ser consultados.</p></Card>;
  if (!dados) return <Card><p className="font-bold text-slate-500">Ainda não há dados de acesso para este período.</p></Card>;
  const a = dados.acessos;
  const hora = (valor: string) => { const h = valor.slice(-2); return /^[0-9]{2}$/.test(h) ? h + "h" : valor; };
  const horarios = agruparHoras(a.horarios ?? []);
  return <div className="space-y-6">
    <Card><Titulo>Dados de navegação</Titulo><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Os gráficos mostram como as pessoas usam o site. Nenhum nome, CPF, telefone ou e-mail é enviado para esta análise.</p></Card>
    <div className="grid gap-6 lg:grid-cols-3"><Ranking titulo="Dispositivos utilizados" descricao="Mostra celular, computador e tablet quando houver acessos." dados={a.dispositivos ?? []} /><Ranking titulo="Páginas mais acessadas" descricao="Telas mais abertas no período." dados={a.paginas ?? []} /><Ranking titulo="Horários de acesso" descricao="Horas em que houve mais pessoas ativas." dados={a.horarios ?? []} formatar={hora} /></div>
    <div className="grid gap-6 lg:grid-cols-2"><GraficoDeColunas dados={horarios} /><GraficoCircular dados={a.dispositivos ?? []} /></div>
  </div>;
}

function formatoData(valor: string) { const data = new Date(valor); return Number.isNaN(data.getTime()) ? "Data não informada" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
function filtrarPeriodo(inscricao: InscricaoAdministrativa, periodo: Periodo, inicio: string, fim: string) { const intervalo = faixa(periodo, inicio, fim); if (!intervalo) return false; const data = new Date(inscricao.criadaEm); return Number.isNaN(data.getTime()) || (data >= new Date(intervalo.inicio + "T00:00:00") && data <= new Date(intervalo.fim + "T23:59:59")); }

function AcoesDeExportacao({ onCsv, onPdf, desabilitado = false }: { onCsv: () => void; onPdf: () => void; desabilitado?: boolean }) {
  const estilo = "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50";
  return <div className="flex flex-wrap gap-3"><button type="button" onClick={onCsv} disabled={desabilitado} className={[estilo, "bg-[#0257a0] text-white hover:bg-[#01477f]"].join(" ")}><Download className="size-4" />Baixar CSV</button><button type="button" onClick={onPdf} disabled={desabilitado} className={[estilo, "border border-[#008bff] bg-white text-[#0257a0] hover:bg-[#e6f0fa]"].join(" ")}><FileText className="size-4" />Visualizar / salvar PDF</button></div>;
}

function Inscricoes({ periodo, inicio, fim, textoDoPeriodo }: { periodo: Periodo; inicio: string; fim: string; textoDoPeriodo: string }) {
  const [dados, setDados] = useState<InscricaoAdministrativa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [escola, setEscola] = useState("");
  const [nivel, setNivel] = useState("");
  const [turno, setTurno] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarInscricoesAdministrativas().then((linhas) => { if (ativo) setDados(linhas); }).catch(() => {
      if (ativo) setErro("Não foi possível ler as inscrições. Confirme no Supabase se a permissão administrativa foi criada.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const opcoes = useMemo(() => ({
    cidades: [...new Set(dados.map((item) => item.cidade).filter(Boolean))],
    bairros: [...new Set(dados.map((item) => item.bairro).filter(Boolean))],
    escolas: [...new Set(dados.map((item) => item.escola).filter(Boolean))],
    niveis: [...new Set(dados.map((item) => item.nivel).filter(Boolean))],
    turnos: [...new Set(dados.map((item) => item.turno).filter(Boolean))],
  }), [dados]);

  const visiveis = useMemo(() => dados.filter((item) => filtrarPeriodo(item, periodo, inicio, fim))
    .filter((item) => !busca || (item.nome + " " + item.email).toLowerCase().includes(busca.toLowerCase()))
    .filter((item) => !cidade || item.cidade === cidade)
    .filter((item) => !bairro || item.bairro === bairro)
    .filter((item) => !escola || item.escola === escola)
    .filter((item) => !nivel || item.nivel === nivel)
    .filter((item) => !turno || item.turno === turno), [bairro, busca, cidade, dados, escola, fim, inicio, nivel, periodo, turno]);

  const select = (valor: string, mudar: (valor: string) => void, lista: string[], rotulo: string) => <select value={valor} onChange={(evento) => mudar(evento.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#008bff]"><option value="">{rotulo}</option>{lista.map((item) => <option key={item} value={item}>{item}</option>)}</select>;

  return <div className="space-y-6">
    <Card><Titulo>Lista de inscrições</Titulo><p className="mt-2 text-sm leading-6 text-slate-500">Consulte as inscrições recebidas e filtre por cidade, bairro, escola, nível ou turno.</p><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3"><input value={busca} onChange={(evento) => setBusca(evento.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" placeholder="Buscar por nome ou e-mail" />{select(cidade, setCidade, opcoes.cidades, "Cidade")}{select(bairro, setBairro, opcoes.bairros, "Bairro")}{select(escola, setEscola, opcoes.escolas, "Escola")}{select(nivel, setNivel, opcoes.niveis, "Nível")}{select(turno, setTurno, opcoes.turnos, "Turno")}</div></Card>
    <Card><div className="flex flex-wrap items-center justify-between gap-5"><div><Titulo>Exportar e guardar inscrições</Titulo><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Baixe uma planilha para a equipe ou abra uma versão pronta para imprimir e salvar como PDF. Os arquivos respeitam o período e todos os filtros escolhidos.</p><p className="mt-2 text-xs font-bold text-slate-500">Por segurança, inscrições não são excluídas automaticamente.</p></div><AcoesDeExportacao desabilitado={carregando || Boolean(erro)} onCsv={() => exportarInscricoesCsv(visiveis, textoDoPeriodo)} onPdf={() => visualizarInscricoesPdf(visiveis, textoDoPeriodo)} /></div></Card>
    <p className="text-sm text-slate-500">{carregando ? "Carregando inscrições..." : String(visiveis.length) + " inscrição(ões) encontrada(s)"}</p>
    <Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#e6f0fa] text-[#0257a0]"><tr>{["Data", "Nome", "Bairro", "Escola", "Nível", "Turno", "E-mail"].map((titulo) => <th key={titulo} className="px-5 py-4 font-black">{titulo}</th>)}</tr></thead><tbody>{carregando ? <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">Carregando inscrições...</td></tr> : erro ? <tr><td colSpan={7} className="px-5 py-14 text-center text-red-600">{erro}</td></tr> : visiveis.length ? visiveis.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4 text-slate-500">{formatoData(item.criadaEm)}</td><td className="px-5 py-4 font-bold text-[#1e293b]">{item.nome}</td><td className="px-5 py-4 text-slate-500">{item.bairro || "—"}</td><td className="px-5 py-4 text-slate-500">{item.escola}</td><td className="px-5 py-4 text-slate-500">{item.nivel}</td><td className="px-5 py-4 text-slate-500">{item.turno}</td><td className="px-5 py-4 text-slate-500">{item.email || "—"}</td></tr>) : <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">Nenhuma inscrição encontrada neste período.</td></tr>}</tbody></table></div></Card>
  </div>;
}

function agrupar(inscricoes: InscricaoAdministrativa[], campo: (item: InscricaoAdministrativa) => string) { const mapa = new Map<string, number>(); inscricoes.forEach((item) => { const nome = campo(item) || "Não informado"; mapa.set(nome, (mapa.get(nome) ?? 0) + 1); }); return [...mapa].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total); }
function Relatorios({ periodo, inicio, fim, textoDoPeriodo }: { periodo: Periodo; inicio: string; fim: string; textoDoPeriodo: string }) {
  const [dados, setDados] = useState<InscricaoAdministrativa[]>([]);
  const [erro, setErro] = useState("");
  const [escola, setEscola] = useState("");
  const [turno, setTurno] = useState("");

  useEffect(() => {
    let ativo = true;
    carregarInscricoesAdministrativas().then((linhas) => { if (ativo) setDados(linhas); }).catch(() => {
      if (ativo) setErro("Não foi possível montar os relatórios de inscrições.");
    });
    return () => { ativo = false; };
  }, []);

  const escolas = useMemo(() => [...new Set(dados.map((item) => item.escola).filter(Boolean))], [dados]);
  const turnos = useMemo(() => [...new Set(dados.map((item) => item.turno).filter(Boolean))], [dados]);
  const filtradas = useMemo(() => dados.filter((item) => filtrarPeriodo(item, periodo, inicio, fim)).filter((item) => !escola || item.escola === escola).filter((item) => !turno || item.turno === turno), [dados, escola, fim, inicio, periodo, turno]);
  const porBairro = agrupar(filtradas, (item) => item.bairro);
  const porCidade = agrupar(filtradas, (item) => item.cidade);
  const porEscola = agrupar(filtradas, (item) => item.escola);
  const porNivel = agrupar(filtradas, (item) => item.nivel);
  const linhasParaExportar = [
    ...porBairro.map((item) => ({ categoria: "Inscrições por bairro", item: item.nome, total: item.total })),
    ...porCidade.map((item) => ({ categoria: "Inscrições por cidade", item: item.nome, total: item.total })),
    ...porEscola.map((item) => ({ categoria: "Escolas mais procuradas", item: item.nome, total: item.total })),
    ...porNivel.map((item) => ({ categoria: "Níveis de ensino procurados", item: item.nome, total: item.total })),
  ];

  if (erro) return <Card className="border-red-200 bg-red-50"><p className="font-bold text-red-700">{erro}</p></Card>;
  return <div className="grid gap-6 lg:grid-cols-2">
    <Card className="lg:col-span-2"><Titulo>Exportar relatório</Titulo><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Escolha uma escola ou turno, se quiser, e baixe os totais em planilha. A versão PDF organiza os mesmos dados por bairro, cidade, escola e nível.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={escola} onChange={(evento) => setEscola(evento.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#008bff]"><option value="">Todas as escolas</option>{escolas.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={turno} onChange={(evento) => setTurno(evento.target.value)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#008bff]"><option value="">Todos os turnos</option>{turnos.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="mt-5"><AcoesDeExportacao onCsv={() => exportarRelatorioCsv(linhasParaExportar, textoDoPeriodo)} onPdf={() => visualizarRelatorioPdf(linhasParaExportar, textoDoPeriodo)} /></div></Card>
    <Ranking titulo="Inscrições por bairro" descricao="Bairros informados nas inscrições." dados={porBairro} />
    <Ranking titulo="Inscrições por cidade" descricao="Cidades informadas nas inscrições." dados={porCidade} />
    <Ranking titulo="Escolas mais procuradas" descricao="Escolas escolhidas pelas pessoas inscritas." dados={porEscola} />
    <Ranking titulo="Níveis de ensino procurados" descricao="Nível escolhido em cada inscrição." dados={porNivel} />
  </div>;
}

function Emails() { return <div className="space-y-6"><Card><Titulo>Envio de e-mails</Titulo><p className="mt-2 text-sm leading-6 text-slate-500">O Make envia os e-mails hoje, mas ainda não devolve ao banco a confirmação de envio ou falha. Por isso, os números abaixo ficam como “A calcular”.</p></Card><div className="grid gap-4 md:grid-cols-3">{[["Na fila", MailWarning, "text-amber-600"], ["Enviados", Mail, "text-[#008bff]"], ["Com falha", MailWarning, "text-red-600"]].map(([titulo, Icon, cor]) => { const Componente = Icon as typeof Mail; return <Card key={titulo as string}><Componente className={["size-6", cor as string].join(" ")} /><div className="mt-4"><EmCalculo /><p className="mt-1 text-sm font-black text-[#1e293b]">{titulo as string}</p></div></Card>; })}</div></div>; }

export default function EstatisticasRelatorios({ onVoltar }: { onVoltar: () => void }) {
  const [aba, setAba] = useState<Aba>("resumo");
  const [periodo, setPeriodo] = useState<Periodo>("Últimos 7 dias");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [dados, setDados] = useState<EstatisticasAnalytics | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [retrospectivaAberta, setRetrospectivaAberta] = useState(false);
  const intervalo = useMemo(() => faixa(periodo, inicio, fim), [periodo, inicio, fim]);
  const textoDoPeriodo = useMemo(() => periodo === "Personalizado" && inicio && fim ? inicio.split("-").reverse().join("/") + " até " + fim.split("-").reverse().join("/") : periodo, [periodo, inicio, fim]);

  useEffect(() => {
    let ativo = true;
    if (!intervalo) {
      setDados(null);
      setCarregando(false);
      setErro("Escolha a data inicial e a data final para consultar este período.");
      return () => { ativo = false; };
    }
    setCarregando(true);
    setErro("");
    carregarEstatisticasAnalytics(intervalo).then((resultado) => {
      if (ativo) setDados(resultado);
    }).catch((falha: unknown) => {
      if (ativo) setErro(falha instanceof Error ? falha.message : "Não foi possível consultar os dados de acesso.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [intervalo]);

  const botaoRetrospectiva = aba === "acessos" && dados && !carregando && !erro && <button type="button" onClick={() => setRetrospectivaAberta(true)} className="group inline-flex h-12 items-center gap-2 rounded-xl bg-[#0257a0] px-5 text-sm font-black text-white shadow-[0_10px_25px_-10px_rgba(2,87,160,0.9)] transition hover:-translate-y-0.5 hover:bg-[#008bff] hover:shadow-[0_14px_30px_-10px_rgba(0,139,255,0.9)]"><span className="grid size-7 place-items-center rounded-lg bg-white/20 transition group-hover:scale-110"><Play className="size-3.5 fill-white" /></span>Ver Retrospectiva</button>;

  return <section className="mx-auto max-w-7xl px-8 py-10">
    <button type="button" onClick={onVoltar} className="inline-flex items-center gap-2 text-sm font-black text-[#008bff] hover:text-[#0257a0]"><ArrowLeft className="size-4" />Voltar ao painel</button>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-3xl font-black text-[#0257a0]">Estatísticas e Relatórios</h1><p className="mt-1 text-sm text-slate-500">Acompanhe os acessos ao site e as inscrições recebidas.</p><p className="mt-3 text-xs text-slate-500">Período selecionado: <strong className="text-[#1e293b]">{textoDoPeriodo}</strong></p></div><div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">{(["Hoje", "Últimos 7 dias", "Mês", "Personalizado"] as Periodo[]).map((item) => <button type="button" key={item} onClick={() => setPeriodo(item)} className={["rounded-lg px-3 py-2 text-xs font-black transition", periodo === item ? "bg-[#0257a0] text-white" : "text-slate-500 hover:bg-[#e6f0fa] hover:text-[#0257a0]"].join(" ")}>{item}</button>)}</div></div>
    {periodo === "Personalizado" && <div className="mt-4 flex items-center gap-3"><input type="date" value={inicio} onChange={(evento) => setInicio(evento.target.value)} className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" /><span className="text-sm text-slate-500">até</span><input type="date" value={fim} onChange={(evento) => setFim(evento.target.value)} className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" /></div>}
    <div className="mt-8 flex items-end justify-between border-b border-slate-200"><div className="flex">{abas.map((item) => <button type="button" key={item.id} onClick={() => setAba(item.id)} className={["-mb-px shrink-0 border-b-2 px-5 py-3 text-sm font-black transition", aba === item.id ? "border-[#0257a0] text-[#0257a0]" : "border-transparent text-slate-400 hover:text-[#4e8afb]"].join(" ")}>{item.titulo}</button>)}</div><div className="mb-2">{botaoRetrospectiva}</div></div>
    <div className="mt-7">{aba === "resumo" && <Resumo dados={dados} carregando={carregando} erro={erro} />}{aba === "acessos" && <Acessos dados={dados} carregando={carregando} erro={erro} />}{aba === "inscricoes" && <Inscricoes periodo={periodo} inicio={inicio} fim={fim} textoDoPeriodo={textoDoPeriodo} />}{aba === "relatorios" && <Relatorios periodo={periodo} inicio={inicio} fim={fim} textoDoPeriodo={textoDoPeriodo} />}{aba === "emails" && <Emails />}</div>
    {retrospectivaAberta && dados && <RetrospectivaAcessos dados={dados} periodo={periodo} inicio={inicio} fim={fim} textoDoPeriodo={textoDoPeriodo} aoFechar={() => setRetrospectivaAberta(false)} />}
  </section>;
}
