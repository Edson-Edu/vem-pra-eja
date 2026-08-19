"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ClipboardEdit,
  Eye,
  FileBarChart,
  ListChecks,
  Mail,
  MailWarning,
  School,
  Smartphone,
  Users,
} from "lucide-react";
import { carregarInscricoesAdministrativas, type InscricaoAdministrativa } from "../lib/admin-escolas";

type Aba = "resumo" | "acessos" | "inscricoes" | "relatorios" | "emails";
type Periodo = "Hoje" | "Últimos 7 dias" | "Mês" | "Personalizado";

const abas: Array<{ id: Aba; titulo: string }> = [
  { id: "resumo", titulo: "Resumo" },
  { id: "acessos", titulo: "Acessos" },
  { id: "inscricoes", titulo: "Inscrições" },
  { id: "relatorios", titulo: "Relatórios" },
  { id: "emails", titulo: "E-mails" },
];

const idDoGoogleAnalytics = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
const analyticsConfigurado = Boolean(idDoGoogleAnalytics && idDoGoogleAnalytics !== "G-SEU_CODIGO_AQUI");

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-8px_rgba(2,87,160,0.12)] ${className}`}>{children}</section>;
}

function EmCalculo({ pequeno = false }: { pequeno?: boolean }) {
  return <span className={pequeno ? "text-sm font-bold text-slate-500" : "text-2xl font-black text-slate-500"}>A calcular</span>;
}

function CartaoIndicador({ titulo, explicacao, icone: Icon, alerta = false }: { titulo: string; explicacao: string; icone: typeof Eye; alerta?: boolean }) {
  const cor = alerta ? "text-red-600" : "text-[#008bff]";
  return <Card><span className={`grid size-9 place-items-center rounded-xl ${alerta ? "bg-red-50" : "bg-[#e6f0fa]"} ${cor}`}><Icon className="size-5" /></span><div className="mt-4"><EmCalculo /><p className={`mt-1 text-sm font-black ${alerta ? "text-red-600" : "text-[#1e293b]"}`}>{titulo}</p><p className="mt-1 text-xs leading-5 text-slate-500">{explicacao}</p></div></Card>;
}

function TituloSecao({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-black text-[#0257a0]">{children}</h2>;
}

function PainelSemDados({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <Card className="grid min-h-64 place-items-center text-center"><div className="max-w-lg"><BarChart3 className="mx-auto size-9 text-[#008bff]" /><TituloSecao>{titulo}</TituloSecao><div className="mt-3 text-sm leading-6 text-slate-500">{children}</div></div></Card>;
}

function Resumo({ periodo }: { periodo: Periodo }) {
  const indicadores = [
    { titulo: "Pessoas que entraram no site", explicacao: "Abriram o Vem pra EJA no período escolhido.", icone: Eye },
    { titulo: "Escolheram Fundamental ou Médio", explicacao: "Avançaram depois de responder sobre o nível de estudo.", icone: ListChecks },
    { titulo: "Abriram detalhes de uma escola", explicacao: "Escolheram uma escola para conhecer melhor.", icone: School },
    { titulo: "Começaram a preencher a inscrição", explicacao: "Chegaram ao formulário de inscrição.", icone: ClipboardEdit },
    { titulo: "Enviaram a inscrição", explicacao: "Clicaram em enviar após preencher o formulário.", icone: CheckCircle2 },
    { titulo: "E-mails enviados para as escolas", explicacao: "Será calculado quando o serviço de e-mail confirmar cada envio.", icone: Mail },
    { titulo: "E-mails que precisam de atenção", explicacao: "Será calculado quando houver retorno de falha do serviço de e-mail.", icone: MailWarning, alerta: true },
  ];
  const etapas = ["Entraram no site", "Escolheram um nível", "Abriram uma escola", "Começaram a inscrição", "Enviaram a inscrição"];
  return <div className="space-y-6"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{indicadores.map((indicador) => <CartaoIndicador key={indicador.titulo} {...indicador} />)}</div><Card><TituloSecao>Caminho das pessoas no site</TituloSecao><p className="mt-1 text-sm text-slate-500">Mostra em qual etapa as pessoas seguiram ou pararam no período selecionado.</p><div className="mt-6 space-y-4">{etapas.map((etapa, indice) => <div key={etapa}><div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-[#1e293b]">{etapa}</span>{indice > 0 && <span className="text-xs text-slate-400">Aguardando dados</span>}</div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6f0fa]"><div className="h-full rounded-full bg-[#0257a0]" style={{ width: `${100 - indice * 12}%`, opacity: 0.22 }} /></div></div>)}</div><p className="mt-5 text-xs text-slate-500">Os números começarão a aparecer após configurar o Google Analytics. Período atual: <strong>{periodo}</strong>.</p></Card></div>;
}

function Acessos() {
  return <div className="space-y-6"><Card><div className="flex flex-wrap items-start justify-between gap-4"><div><TituloSecao>Dados de navegação</TituloSecao><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Aqui aparecerão acessos por dia e horário, celular ou computador, escolas mais abertas e origem dos acessos. Nenhum nome, CPF, telefone ou e-mail é enviado ao Google Analytics.</p></div><a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0257a0] px-4 py-2.5 text-sm font-black text-white hover:bg-[#014884]"><BarChart3 className="size-4" />Abrir Google Analytics</a></div><div className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${analyticsConfigurado ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{analyticsConfigurado ? "Google Analytics está configurado. Os dados podem levar até 24 horas para aparecer no painel do Google." : "Google Analytics ainda não está configurado. Adicione o ID G- no arquivo .env.local para começar a coletar dados."}</div></Card><div className="grid gap-6 lg:grid-cols-2"><PainelSemDados titulo="Acessos por dia e horário">Quando houver dados, este gráfico mostrará os horários em que mais pessoas acessam o site.</PainelSemDados><PainelSemDados titulo="Celular ou computador">Você verá qual tipo de aparelho as pessoas mais usam para acessar o Vem pra EJA.</PainelSemDados><PainelSemDados titulo="Escolas mais abertas">Mostrará quais escolas receberam mais visualizações de detalhes.</PainelSemDados><PainelSemDados titulo="De onde as pessoas vieram">Mostrará acessos por link direto, Google, Instagram, WhatsApp e outras origens.</PainelSemDados><PainelSemDados titulo="Páginas mais acessadas">Mostrará quais telas foram mais abertas pelas pessoas.</PainelSemDados><PainelSemDados titulo="Cidades aproximadas">Informação agregada estimada pelo Google Analytics, quando disponível.</PainelSemDados></div></div>;
}

function formatarData(data: string) {
  const valor = new Date(data);
  return Number.isNaN(valor.getTime()) ? "Data não informada" : valor.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function estaNoPeriodo(inscricao: InscricaoAdministrativa, periodo: Periodo, inicio: string, fim: string) {
  const data = new Date(inscricao.criadaEm);
  if (Number.isNaN(data.getTime())) return true;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (periodo === "Hoje") return data >= hoje;
  if (periodo === "Últimos 7 dias") { const limite = new Date(hoje); limite.setDate(limite.getDate() - 6); return data >= limite; }
  if (periodo === "Mês") return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
  if (inicio && data < new Date(`${inicio}T00:00:00`)) return false;
  if (fim && data > new Date(`${fim}T23:59:59`)) return false;
  return true;
}

function Inscricoes({ periodo, inicio, fim }: { periodo: Periodo; inicio: string; fim: string }) {
  const [inscricoes, setInscricoes] = useState<InscricaoAdministrativa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [escola, setEscola] = useState("");
  const [nivel, setNivel] = useState("");
  const [turno, setTurno] = useState("");
  useEffect(() => { let ativa = true; setCarregando(true); carregarInscricoesAdministrativas().then((dados) => { if (ativa) { setInscricoes(dados); setErro(""); } }).catch(() => { if (ativa) setErro("Não foi possível ler as inscrições. Confirme no Supabase se a permissão administrativa foi criada."); }).finally(() => { if (ativa) setCarregando(false); }); return () => { ativa = false; }; }, []);
  const opcoes = useMemo(() => ({ cidades: [...new Set(inscricoes.map((item) => item.cidade).filter(Boolean))], bairros: [...new Set(inscricoes.map((item) => item.bairro).filter(Boolean))], escolas: [...new Set(inscricoes.map((item) => item.escola).filter(Boolean))], niveis: [...new Set(inscricoes.map((item) => item.nivel).filter(Boolean))], turnos: [...new Set(inscricoes.map((item) => item.turno).filter(Boolean))] }), [inscricoes]);
  const visiveis = useMemo(() => inscricoes.filter((item) => estaNoPeriodo(item, periodo, inicio, fim)).filter((item) => !busca.trim() || `${item.nome} ${item.email}`.toLocaleLowerCase().includes(busca.trim().toLocaleLowerCase())).filter((item) => !cidade || item.cidade === cidade).filter((item) => !bairro || item.bairro === bairro).filter((item) => !escola || item.escola === escola).filter((item) => !nivel || item.nivel === nivel).filter((item) => !turno || item.turno === turno), [bairro, busca, cidade, escola, fim, inicio, inscricoes, nivel, periodo, turno]);
  const select = (valor: string, aoMudar: (valor: string) => void, opcoesDoFiltro: string[], titulo: string) => <select value={valor} onChange={(evento) => aoMudar(evento.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#008bff]"><option value="">{titulo}</option>{opcoesDoFiltro.map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}</select>;
  return <div className="space-y-6"><Card><TituloSecao>Lista de inscrições</TituloSecao><p className="mt-2 text-sm leading-6 text-slate-500">Consulte as inscrições recebidas e filtre por cidade, bairro, escola, nível ou turno.</p><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3"><input value={busca} onChange={(evento) => setBusca(evento.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" placeholder="Buscar por nome ou e-mail" />{select(cidade, setCidade, opcoes.cidades, "Cidade")}{select(bairro, setBairro, opcoes.bairros, "Bairro")}{select(escola, setEscola, opcoes.escolas, "Escola")}{select(nivel, setNivel, opcoes.niveis, "Nível")}{select(turno, setTurno, opcoes.turnos, "Turno")}</div></Card><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{carregando ? "Carregando inscrições..." : `${visiveis.length} inscrição(ões) encontrada(s)`}</p></div><Card className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#e6f0fa] text-[#0257a0]"><tr>{["Data", "Nome", "Bairro", "Escola", "Nível", "Turno", "E-mail"].map((titulo) => <th key={titulo} className="px-5 py-4 font-black">{titulo}</th>)}</tr></thead><tbody>{carregando ? <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">Carregando inscrições...</td></tr> : erro ? <tr><td colSpan={7} className="px-5 py-14 text-center text-red-600"><p className="font-bold">{erro}</p></td></tr> : visiveis.length ? visiveis.map((inscricao) => <tr key={inscricao.id} className="border-t border-slate-100"><td className="px-5 py-4 text-slate-500">{formatarData(inscricao.criadaEm)}</td><td className="px-5 py-4 font-bold text-[#1e293b]">{inscricao.nome}</td><td className="px-5 py-4 text-slate-500">{inscricao.bairro || "—"}</td><td className="px-5 py-4 text-slate-500">{inscricao.escola}</td><td className="px-5 py-4 text-slate-500">{inscricao.nivel}</td><td className="px-5 py-4 text-slate-500">{inscricao.turno}</td><td className="px-5 py-4 text-slate-500">{inscricao.email || "—"}</td></tr>) : <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">Nenhuma inscrição encontrada neste período.</td></tr>}</tbody></table></div></Card></div>;
}

function Relatorios() {
  const relatorios = ["Inscrições por bairro", "Inscrições por cidade", "Escolas e turnos mais procurados", "Inscrições por nível de ensino"];
  return <div className="grid gap-6 lg:grid-cols-2">{relatorios.map((titulo) => <PainelSemDados key={titulo} titulo={titulo}>Os gráficos serão calculados a partir das inscrições registradas no banco administrativo.</PainelSemDados>)}</div>;
}

function Emails() {
  return <div className="space-y-6"><Card><TituloSecao>Envio de e-mails</TituloSecao><p className="mt-2 text-sm leading-6 text-slate-500">O Make envia os e-mails hoje, mas ainda não devolve ao banco a confirmação de envio ou falha. Por isso, os números abaixo ficam como “A calcular”.</p></Card><div className="grid gap-4 md:grid-cols-3">{[["Na fila", MailWarning, "text-amber-600"], ["Enviados", Mail, "text-[#008bff]"], ["Com falha", MailWarning, "text-red-600"]].map(([titulo, Icon, cor]) => { const Componente = Icon as typeof Mail; return <Card key={titulo as string}><Componente className={`size-6 ${cor as string}`} /><div className="mt-4"><EmCalculo /><p className="mt-1 text-sm font-black text-[#1e293b]">{titulo as string}</p></div></Card>; })}</div><PainelSemDados titulo="Histórico de e-mails">Quando o envio migrar para a Edge Function, esta tabela mostrará data, pessoa inscrita, escola, status e uma opção de reenvio quando for necessário.</PainelSemDados></div>;
}

export default function EstatisticasRelatorios({ onVoltar }: { onVoltar: () => void }) {
  const [aba, setAba] = useState<Aba>("resumo");
  const [periodo, setPeriodo] = useState<Periodo>("Últimos 7 dias");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const descricaoPeriodo = useMemo(() => periodo === "Personalizado" && inicio && fim ? `${inicio.split("-").reverse().join("/")} até ${fim.split("-").reverse().join("/")}` : periodo, [fim, inicio, periodo]);

  return <section className="mx-auto max-w-7xl px-8 py-10"><button type="button" onClick={onVoltar} className="inline-flex items-center gap-2 text-sm font-black text-[#008bff] hover:text-[#0257a0]"><ArrowLeft className="size-4" />Voltar ao painel</button><div className="mt-6 flex flex-wrap items-start justify-between gap-5"><div><h1 className="text-3xl font-black text-[#0257a0]">Estatísticas e Relatórios</h1><p className="mt-1 text-sm text-slate-500">Acompanhe os acessos ao site e as inscrições recebidas.</p><p className="mt-3 text-xs text-slate-500">Período selecionado: <strong className="text-[#1e293b]">{descricaoPeriodo}</strong></p></div><div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">{(["Hoje", "Últimos 7 dias", "Mês", "Personalizado"] as Periodo[]).map((opcao) => <button type="button" key={opcao} onClick={() => setPeriodo(opcao)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${periodo === opcao ? "bg-[#0257a0] text-white" : "text-slate-500 hover:bg-[#e6f0fa] hover:text-[#0257a0]"}`}>{opcao}</button>)}</div></div>{periodo === "Personalizado" && <div className="mt-4 flex items-center gap-3"><input type="date" value={inicio} onChange={(evento) => setInicio(evento.target.value)} className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" /><span className="text-sm text-slate-500">até</span><input type="date" value={fim} onChange={(evento) => setFim(evento.target.value)} className="h-10 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-[#008bff]" /></div>}<div className="mt-8 flex overflow-x-auto border-b border-slate-200">{abas.map((item) => <button type="button" key={item.id} onClick={() => setAba(item.id)} className={`-mb-px shrink-0 border-b-2 px-5 py-3 text-sm font-black transition ${aba === item.id ? "border-[#0257a0] text-[#0257a0]" : "border-transparent text-slate-400 hover:text-[#4e8afb]"}`}>{item.titulo}</button>)}</div><div className="mt-7">{aba === "resumo" && <Resumo periodo={periodo} />}{aba === "acessos" && <Acessos />}{aba === "inscricoes" && <Inscricoes periodo={periodo} inicio={inicio} fim={fim} />}{aba === "relatorios" && <Relatorios />}{aba === "emails" && <Emails />}</div></section>;
}
