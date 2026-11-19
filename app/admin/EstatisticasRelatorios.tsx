"use client";

import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { ArrowLeft, BarChart3, Building2, Download, Eye, Map, MessageCircle, MonitorSmartphone, Presentation, Printer, UsersRound } from "lucide-react";
import { carregarEstatisticasAnalytics, type EstatisticasAnalytics, type GrupoAnalytics } from "../lib/analytics-admin";
import { exportarMetricasCsv } from "../lib/exportacao-administrativa";
import RelatorioImpressao from "./RelatorioImpressao";
import RetrospectivaAcessos from "./RetrospectivaAcessos";

type Periodo = "Hoje" | "Últimos 7 dias" | "Mês" | "Personalizado";
type Aba = "resumo" | "acessos" | "encaminhamentos" | "relatorios";
const abas: Array<{ id: Aba; nome: string }> = [{ id: "resumo", nome: "Resumo" }, { id: "acessos", nome: "Acessos" }, { id: "encaminhamentos", nome: "Encaminhamentos" }, { id: "relatorios", nome: "Relatórios" }];

function iso(data: Date) { return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function faixa(periodo: Periodo, inicio: string, fim: string) {
  const hoje = new Date();
  if (periodo === "Personalizado") return { inicio, fim };
  const comeco = new Date(hoje);
  if (periodo === "Últimos 7 dias") comeco.setDate(hoje.getDate() - 6);
  if (periodo === "Mês") comeco.setDate(1);
  return { inicio: iso(comeco), fim: iso(hoje) };
}

export default function EstatisticasRelatorios({ onVoltar }: { onVoltar: () => void }) {
  const hoje = iso(new Date());
  const [periodo, setPeriodo] = useState<Periodo>("Últimos 7 dias");
  const [inicio, setInicio] = useState(hoje);
  const [fim, setFim] = useState(hoje);
  const [aba, setAba] = useState<Aba>("resumo");
  const [dados, setDados] = useState<EstatisticasAnalytics | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [retrospectiva, setRetrospectiva] = useState(false);
  const [geradoEm, setGeradoEm] = useState("");
  const datas = useMemo(() => faixa(periodo, inicio, fim), [periodo, inicio, fim]);
  const textoPeriodo = `${new Date(`${datas.inicio}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${datas.fim}T12:00:00`).toLocaleDateString("pt-BR")}`;
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");
    carregarEstatisticasAnalytics(datas)
      .then((valor) => { if (ativo) setDados(valor); })
      .catch((causa) => { if (ativo) setErro(causa instanceof Error ? causa.message : "Não foi possível consultar as métricas."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [datas]);

  const imprimir = () => {
    flushSync(() => setGeradoEm(new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())));
    window.print();
  };

  return (
    <>
      <section data-admin-estatisticas className="mx-auto max-w-7xl px-8 py-10">
        <button type="button" onClick={onVoltar} className="inline-flex items-center gap-2 text-sm font-black text-azul-acao"><ArrowLeft className="size-4" />Voltar ao painel</button>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-black text-azul-principal">Estatísticas e relatórios</h1>
            <p className="mt-2 text-sm text-slate-500">Métricas agregadas de uso e encaminhamentos; nenhum visitante é identificado.</p>
            <p className="mt-2 text-xs font-bold text-slate-500">{textoPeriodo}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Hoje", "Últimos 7 dias", "Mês", "Personalizado"] as Periodo[]).map((item) => <button type="button" key={item} onClick={() => setPeriodo(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${periodo === item ? "bg-azul-principal text-white" : "border bg-white text-slate-600"}`}>{item}</button>)}
          </div>
        </div>
        {periodo === "Personalizado" && <div className="mt-4 flex flex-wrap gap-3"><label className="text-sm font-bold">Início<input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="ml-2 rounded-lg border p-2" /></label><label className="text-sm font-bold">Fim<input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="ml-2 rounded-lg border p-2" /></label></div>}
        <div className="mt-8 flex border-b">{abas.map((item) => <button type="button" key={item.id} onClick={() => setAba(item.id)} className={`border-b-2 px-5 py-3 text-sm font-black ${aba === item.id ? "border-azul-principal text-azul-principal" : "border-transparent text-slate-500"}`}>{item.nome}</button>)}</div>
        {erro && <Card><p role="alert" className="font-bold text-red-700">{erro}</p></Card>}
        {carregando && <Card><p className="text-slate-500">Carregando métricas…</p></Card>}
        {!carregando && dados && <div className="mt-6">
          {aba === "resumo" && <Resumo dados={dados} />}
          {aba === "acessos" && <div className="grid gap-5 lg:grid-cols-3"><Ranking titulo="Dispositivos" dados={dados.acessos.dispositivos} Icon={MonitorSmartphone} /><Ranking titulo="Páginas acessadas" dados={dados.acessos.paginas} Icon={Eye} /><Ranking titulo="Horários" dados={dados.acessos.horarios} Icon={BarChart3} /></div>}
          {aba === "encaminhamentos" && <><Card><p className="font-bold text-amber-900">Clique no WhatsApp significa apenas que o canal foi aberto. Não comprova conversa, matrícula ou vaga.</p></Card><div className="grid gap-5 lg:grid-cols-3"><Ranking titulo="Escolas" dados={dados.encaminhamentos.escolas} Icon={Building2} /><Ranking titulo="Níveis" dados={dados.encaminhamentos.niveis} Icon={UsersRound} /><Ranking titulo="Turnos" dados={dados.encaminhamentos.turnos} Icon={Map} /></div></>}
          {aba === "relatorios" && <Card><h2 className="text-xl font-black text-azul-principal">Exportar dados agregados</h2><p className="mt-2 text-sm text-slate-500">Os arquivos não contêm nome, CPF, telefone, e-mail, IP nem identificador de visitante.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => exportarMetricasCsv(dados, textoPeriodo)} className="inline-flex items-center gap-2 rounded-xl bg-azul-principal px-4 py-3 font-black text-white"><Download className="size-4" />Baixar CSV</button><button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-xl border border-azul-principal px-4 py-3 font-black text-azul-principal"><Printer className="size-4" />Imprimir / PDF</button><button type="button" onClick={() => setRetrospectiva(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 font-black text-white"><Presentation className="size-4" />Ver retrospectiva</button></div></Card>}
        </div>}
        {retrospectiva && dados && <RetrospectivaAcessos dados={dados} periodo={textoPeriodo} aoFechar={() => setRetrospectiva(false)} />}
      </section>
      {dados && <RelatorioImpressao dados={dados} periodo={textoPeriodo} geradoEm={geradoEm} />}
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) { return <div className="mt-5 rounded-2xl bg-white p-6 shadow-[0_8px_24px_-8px_rgba(2,87,160,.14)]">{children}</div>; }
function Resumo({ dados }: { dados: EstatisticasAnalytics }) { const itens = [{ nome: "Visitas", total: dados.resumo.visitas, Icon: Eye }, { nome: "Nível selecionado", total: dados.resumo.escolheuNivel, Icon: UsersRound }, { nome: "Mapa visualizado", total: dados.resumo.abriuMapa, Icon: Map }, { nome: "Escola visualizada", total: dados.resumo.abriuEscola, Icon: Building2 }, { nome: "Chegaram ao contato", total: dados.resumo.chegouContato, Icon: MessageCircle }, { nome: "Cliques no WhatsApp", total: dados.resumo.cliquesWhatsapp, Icon: MessageCircle }]; return <><div className="grid gap-4 md:grid-cols-3">{itens.map(({ nome, total, Icon }) => <Card key={nome}><Icon className="size-6 text-azul-acao" /><strong className="mt-4 block text-3xl font-black text-azul-principal">{total.toLocaleString("pt-BR")}</strong><span className="text-sm font-bold text-slate-600">{nome}</span></Card>)}</div><Card><h2 className="font-black text-azul-principal">Leitura responsável</h2><p className="mt-2 text-sm leading-6 text-slate-600">As contagens são interações agregadas, não pessoas únicas. O VemPraEJA não acompanha a conversa no WhatsApp nem sabe se houve matrícula.</p></Card></>; }
function Ranking({ titulo, dados, Icon }: { titulo: string; dados: GrupoAnalytics; Icon: typeof BarChart3 }) { const maximo = Math.max(1, ...dados.map((item) => item.total)); return <Card><div className="flex items-center gap-2"><Icon className="size-5 text-azul-acao" /><h2 className="font-black text-azul-principal">{titulo}</h2></div><div className="mt-5 space-y-4">{dados.length ? dados.map((item) => <div key={item.nome}><div className="flex justify-between gap-3 text-sm"><span className="font-bold text-slate-700">{item.nome || "Não informado"}</span><strong>{item.total.toLocaleString("pt-BR")}</strong></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-azul-acao" style={{ width: `${Math.max(3, item.total / maximo * 100)}%` }} /></div></div>) : <p className="text-sm text-slate-500">Ainda não há dados neste período.</p>}</div></Card>; }
