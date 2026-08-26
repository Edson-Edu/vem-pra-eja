"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  FilePenLine,
  ImageIcon,
  MapPin,
  Plus,
  School,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { alterarAtivacaoEscola, carregarDadosAdministrativos, criarBeneficioAdministrativo, excluirBeneficioAdministrativo, excluirEscolaAdministrativa, salvarEscolaAdministrativa } from "../lib/admin-escolas";
import EstatisticasRelatorios from "./EstatisticasRelatorios";

export type Nivel = "Ensino Fundamental" | "Ensino Médio";
type Dia = "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo" | "";
export type Beneficio = { id: string; nome: string; descricao: string };
type BeneficioDoTurno = { beneficioId: string; descricaoLocal: string };
export type TurnoFormulario = {
  id: string;
  nivel: Nivel;
  turno: "Manhã" | "Tarde" | "Noite";
  inicio: string;
  fim: string;
  diaInicio: Dia;
  diaFim: Dia;
  comoFunciona: string;
  beneficios: BeneficioDoTurno[];
};
export type EscolaFormulario = {
  id: string | null;
  sigla: string;
  nome: string;
  cidade: "Camboriú" | "Balneário Camboriú";
  bairro: string;
  rua: string;
  numero: string;
  complemento: string;
  endereco?: string;
  email: string;
  latitude: string;
  longitude: string;
  niveis: Nivel[];
  fotos: string[];
  ativa: boolean;
  turnos: TurnoFormulario[];
};

const SIGLAS = ["EBM", "CEJA", "EEB", "CEM", "IFC"];
const CIDADES = ["Camboriú", "Balneário Camboriú"] as const;
const BAIRROS: Record<EscolaFormulario["cidade"], string[]> = {
  Camboriú: ["Centro", "Areias", "Braço", "Cedro", "Conde Vila Verde", "Lídia Duarte", "Macacos", "Monte Alegre", "Rio Pequeno", "Santa Regina", "São Francisco de Assis", "Tabuleiro", "Várzea do Ranchinho"],
  "Balneário Camboriú": ["Ariribá", "Barra", "Barra Sul", "Centro", "Estaleirinho", "Estaleiro", "Estados", "Laranjeiras", "Municípios", "Nações", "Nova Esperança", "Pioneiros", "Praia dos Amores", "São Judas", "Taquaras", "Vila Real"],
};
const DIAS: Dia[] = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const ABREVIACOES: Record<Exclude<Dia, "">, string> = { Segunda: "Seg", Terça: "Ter", Quarta: "Qua", Quinta: "Qui", Sexta: "Sex", Sábado: "Sáb", Domingo: "Dom" };
function novoId(prefixo: string) {
  return `${prefixo}-${crypto.randomUUID()}`;
}

function escolaVazia(): EscolaFormulario {
  return { id: null, sigla: "", nome: "", cidade: "Camboriú", bairro: "", rua: "", numero: "", complemento: "", email: "", latitude: "", longitude: "", niveis: [], fotos: [""], ativa: true, turnos: [] };
}

function novoTurno(nivel: Nivel = "Ensino Fundamental"): TurnoFormulario {
  return { id: novoId("turno"), nivel, turno: "Noite", inicio: "", fim: "", diaInicio: "", diaFim: "", comoFunciona: "", beneficios: [] };
}

function abreviarDias(inicio: Dia, fim: Dia) {
  if (!inicio || !fim) return "";
  return `${ABREVIACOES[inicio]} - ${ABREVIACOES[fim]}`;
}

function Card({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_-8px_rgba(2,87,160,0.14)]"><h2 className="text-base font-black text-[#0257a0]">{titulo}</h2>{descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}<div className="mt-5">{children}</div></section>;
}

function Campo({ titulo, dica, erro, children }: { titulo: string; dica?: string; erro?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-[#1e293b]"><span>{titulo}</span>{children}{erro ? <span className="mt-1 block text-xs font-bold text-red-600">{erro}</span> : dica && <span className="mt-1 block text-xs font-medium text-slate-400">{dica}</span>}</label>;
}

const input = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]";

function Modal({ titulo, perigo = false, mostrarFechar = true, children, onFechar }: { titulo: string; perigo?: boolean; mostrarFechar?: boolean; children: React.ReactNode; onFechar: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><h2 className={`flex items-center gap-2 text-lg font-black ${perigo ? "text-red-600" : "text-[#0257a0]"}`}>{perigo && <TriangleAlert className="size-5" />}{titulo}</h2>{mostrarFechar && <button type="button" onClick={onFechar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fechar"><X /></button>}</div><div className="mt-4">{children}</div></div></div>;
}

function Botao({ children, variante = "principal", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "principal" | "borda" | "perigo" }) {
  const estilo = variante === "principal" ? "bg-[#0257a0] text-white hover:bg-[#014884]" : variante === "perigo" ? "bg-red-600 text-white hover:bg-red-700" : "border border-[#008bff] bg-white text-[#0257a0] hover:bg-[#e6f0fa]";
  return <button type="button" {...props} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${estilo} ${props.className ?? ""}`}>{children}</button>;
}

export default function PainelAdministrativo() {
  const [tela, setTela] = useState<"inicio" | "escolas" | "estatisticas">("inicio");
  const [aba, setAba] = useState<"formulario" | "lista">("formulario");
  const [formulario, setFormulario] = useState<EscolaFormulario>(escolaVazia);
  const [escolas, setEscolas] = useState<EscolaFormulario[]>([]);
  const [catalogo, setCatalogo] = useState<Beneficio[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [modalExcluirEscola, setModalExcluirEscola] = useState<EscolaFormulario | null>(null);
  const [modalExcluirBeneficio, setModalExcluirBeneficio] = useState<Beneficio | null>(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [processando, setProcessando] = useState(false);
  const mostrarMensagem = (texto: string, tipo: "sucesso" | "erro" = "sucesso") => { setTipoMensagem(tipo); setMensagem(texto); };

  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 768px)");
    const atualizar = () => setDesktop(consulta.matches);
    atualizar(); consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);

  const recarregar = useCallback(async (silencioso = false) => {
    setCarregando(true);
    try {
      const dados = await carregarDadosAdministrativos();
      setCatalogo(dados.catalogo);
      setEscolas(dados.escolas);
      return true;
    } catch {
      if (!silencioso) mostrarMensagem("Não foi possível carregar os dados administrativos. Entre novamente se a sessão tiver expirado.", "erro");
      return false;
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const escolasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase();
    if (!termo) return escolas;
    return escolas.filter((escola) => `${escola.sigla} ${escola.nome} ${escola.cidade} ${escola.bairro}`.toLocaleLowerCase().includes(termo));
  }, [busca, escolas]);

  if (desktop === null) return <main className="min-h-dvh bg-[#f2f3f6]" />;
  if (!desktop) return <main className="grid min-h-dvh place-items-center bg-[#f2f3f6] p-6 text-center"><div className="max-w-sm rounded-3xl bg-white p-8 shadow-[0_8px_24px_-8px_rgba(2,87,160,0.14)]"><School className="mx-auto size-10 text-[#008bff]" /><h1 className="mt-5 text-xl font-black text-[#0257a0]">Área administrativa</h1><p className="mt-3 text-sm leading-6 text-slate-600">A página de administrador está disponível somente em computadores.</p></div></main>;

  const editar = (escola: EscolaFormulario) => { setFormulario({ ...escola, fotos: escola.fotos.length ? [...escola.fotos] : [""] }); setAba("formulario"); setTela("escolas"); };
  const alternarAtiva = async (id: string | null) => {
    const escola = escolas.find((item) => item.id === id);
    if (!escola?.id) return;
    setProcessando(true);
    try {
      await alterarAtivacaoEscola(escola.id, !escola.ativa);
      setEscolas((atual) => atual.map((item) => item.id === escola.id ? { ...item, ativa: !item.ativa } : item));
      mostrarMensagem(escola.ativa ? "Escola ocultada do mapa público." : "Escola ativada e visível no mapa público.");
    } catch {
      mostrarMensagem("Não foi possível alterar o status da escola.", "erro");
    } finally { setProcessando(false); }
  };
  const salvar = async () => {
    setProcessando(true);
    try {
      await salvarEscolaAdministrativa(formulario, catalogo);
      setFormulario(escolaVazia()); setAba("lista");
      mostrarMensagem("Escola salva no banco com sucesso.");
      void recarregar(true);
    } catch (erro) {
      mostrarMensagem(erro instanceof Error && erro.message ? `Não foi possível salvar a escola: ${erro.message}` : "Não foi possível salvar a escola. Confira os campos e tente novamente.", "erro");
    } finally { setProcessando(false); }
  };
  const removerBeneficioGlobal = async () => {
    if (!modalExcluirBeneficio) return;
    setProcessando(true);
    try {
      await excluirBeneficioAdministrativo(modalExcluirBeneficio.id);
      await recarregar();
      setFormulario((atual) => ({ ...atual, turnos: atual.turnos.map((turno) => ({ ...turno, beneficios: turno.beneficios.filter((beneficio) => beneficio.beneficioId !== modalExcluirBeneficio.id) })) }));
      setModalExcluirBeneficio(null); mostrarMensagem("Benefício removido de todas as escolas.");
    } catch (erro) {
      mostrarMensagem(erro instanceof Error && erro.message ? `Não foi possível remover o benefício padrão: ${erro.message}` : "Não foi possível remover o benefício padrão.", "erro");
    } finally { setProcessando(false); }
  };
  const adicionarBeneficio = async (nome: string, descricao: string) => {
    setProcessando(true);
    try {
      const beneficio = await criarBeneficioAdministrativo(nome, descricao);
      setCatalogo((atual) => [...atual, beneficio].sort((a, b) => a.nome.localeCompare(b.nome)));
      return true;
    } catch {
      mostrarMensagem("Não foi possível criar o benefício padrão.", "erro");
      return false;
    } finally { setProcessando(false); }
  };
  const excluirEscola = async () => {
    if (!modalExcluirEscola?.id) return;
    setProcessando(true);
    try {
      await excluirEscolaAdministrativa(modalExcluirEscola.id);
      setEscolas((atual) => atual.filter((escola) => escola.id !== modalExcluirEscola.id));
      setModalExcluirEscola(null); setConfirmacao(""); mostrarMensagem("Escola excluída permanentemente.");
    } catch {
      mostrarMensagem("Não foi possível excluir a escola. Ela pode possuir dados vinculados.", "erro");
    } finally { setProcessando(false); }
  };

  return <main className="min-h-dvh bg-[#f2f3f6] text-[#1e293b]">
    {tela === "inicio" && <Inicio onAbrir={setTela} />}
    {tela === "estatisticas" && <EstatisticasRelatorios onVoltar={() => setTela("inicio")} />}
    {tela === "escolas" && <section className="mx-auto max-w-7xl px-8 py-10"><button type="button" onClick={() => setTela("inicio")} className="inline-flex items-center gap-2 text-sm font-black text-[#008bff] hover:text-[#0257a0]"><ArrowLeft className="size-4" />Voltar ao painel</button><h1 className="mt-6 text-3xl font-black text-[#0257a0]">Gerenciar Escolas</h1><p className="mt-1 text-sm text-slate-500">Cadastre, edite e controle a visibilidade das unidades no mapa.</p>
      <div className="mt-8 flex border-b border-slate-200"><Aba ativa={aba === "formulario"} onClick={() => setAba("formulario")}>{formulario.id ? "Editar Escola" : "Adicionar Nova Escola"}</Aba><Aba ativa={aba === "lista"} onClick={() => setAba("lista")}>Escolas Cadastradas</Aba></div>
      {aba === "formulario" ? <FormularioRefinado formulario={formulario} setFormulario={setFormulario} catalogo={catalogo} onAdicionarBeneficio={adicionarBeneficio} onSolicitarExcluirBeneficio={setModalExcluirBeneficio} onSalvar={salvar} onCancelar={() => { setFormulario(escolaVazia()); setAba("lista"); }} processando={processando} /> : <ListaEscolas carregando={carregando || processando} escolas={escolasFiltradas} busca={busca} setBusca={setBusca} onEditar={editar} onAlternarAtiva={alternarAtiva} onExcluir={setModalExcluirEscola} />}
    </section>}
    {modalExcluirEscola && <Modal titulo="Excluir escola definitivamente" perigo onFechar={() => { setModalExcluirEscola(null); setConfirmacao(""); }}><p className="text-sm leading-6 text-slate-600">Você está prestes a excluir <strong>[{modalExcluirEscola.sigla}] {modalExcluirEscola.nome}</strong> do banco de dados. Esta ação é permanente.</p><p className="mt-4 text-sm font-bold text-slate-700">Digite EXCLUIR para confirmar.</p><input value={confirmacao} onChange={(evento) => setConfirmacao(evento.target.value)} className={input} placeholder="EXCLUIR" /><div className="mt-5 flex justify-end gap-3"><Botao variante="borda" onClick={() => { setModalExcluirEscola(null); setConfirmacao(""); }}>Cancelar</Botao><Botao variante="perigo" disabled={confirmacao !== "EXCLUIR" || processando} onClick={() => void excluirEscola()}>Excluir permanentemente</Botao></div></Modal>}
    {modalExcluirBeneficio && <Modal titulo="Excluir benefício de todas as escolas" perigo onFechar={() => setModalExcluirBeneficio(null)}><p className="text-sm leading-6 text-slate-600">Ao confirmar, <strong>{modalExcluirBeneficio.nome}</strong> será removido de todas as escolas e turnos. Para remover somente desta escola, desmarque a caixinha do benefício e salve as alterações. Esta ação não poderá ser desfeita.</p><div className="mt-5 flex justify-end gap-3"><Botao variante="borda" onClick={() => setModalExcluirBeneficio(null)}>Cancelar</Botao><Botao variante="perigo" disabled={processando} onClick={() => void removerBeneficioGlobal()}>Excluir de todas</Botao></div></Modal>}
    {mensagem && <Modal titulo={tipoMensagem === "sucesso" ? "Tudo certo" : "Não foi possível concluir"} perigo={tipoMensagem === "erro"} mostrarFechar={false} onFechar={() => setMensagem("")}><p className="text-sm leading-6 text-slate-600">{mensagem}</p><div className="mt-5 flex justify-end"><Botao onClick={() => setMensagem("")}>OK</Botao></div></Modal>}
  </main>;
}

function Inicio({ onAbrir }: { onAbrir: (tela: "escolas" | "estatisticas") => void }) {
  const cards = [{ titulo: "Gerenciar Escolas", descricao: "Cadastre novas unidades, edite dados e controle a visibilidade no mapa.", icone: School, tela: "escolas" as const }, { titulo: "Estatísticas de Acesso", descricao: "Acompanhe visualizações, buscas e interesse pelas escolas cadastradas.", icone: BarChart3, tela: "estatisticas" as const }];
  return <section className="mx-auto max-w-5xl px-8 py-20"><p className="text-sm font-black tracking-[0.22em] text-[#008bff]">VEM PRA EJA</p><h1 className="mt-3 text-4xl font-black text-[#0257a0]">Painel Administrativo</h1><p className="mt-2 text-slate-500">Selecione uma área para continuar.</p><div className="mt-10 grid grid-cols-2 gap-6">{cards.map((card) => { const Icone = card.icone; return <button key={card.titulo} type="button" onClick={() => onAbrir(card.tela)} className="group rounded-3xl bg-white p-8 text-left shadow-[0_8px_24px_-8px_rgba(2,87,160,0.14)] transition hover:-translate-y-1 hover:shadow-[0_18px_35px_-12px_rgba(2,87,160,0.25)]"><span className="grid size-14 place-items-center rounded-2xl bg-[#e6f0fa] text-[#008bff]"><Icone className="size-7" /></span><h2 className="mt-6 text-xl font-black text-[#1e293b]">{card.titulo}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{card.descricao}</p><span className="mt-6 inline-flex items-center gap-1 text-sm font-black text-[#008bff]">Acessar <ChevronRight className="size-4 transition group-hover:translate-x-1" /></span></button>; })}</div></section>;
}

function Estatisticas({ onVoltar }: { onVoltar: () => void }) {
  return <section className="mx-auto max-w-5xl px-8 py-12"><button type="button" onClick={onVoltar} className="inline-flex items-center gap-2 text-sm font-black text-[#008bff]"><ArrowLeft className="size-4" />Voltar ao painel</button><Card titulo="Estatísticas de Acesso" descricao="Esta área receberá os dados do Google Analytics quando ele for configurado no site."><div className="grid place-items-center py-20 text-center"><BarChart3 className="size-10 text-[#008bff]" /><p className="mt-4 text-lg font-black text-[#0257a0]">Módulo preparado</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Ainda não existem dados de acesso conectados. Quando o Google Analytics for adicionado, esta tela poderá mostrar visitas, páginas mais acessadas e origem dos acessos.</p></div></Card></section>;
}

function Aba({ ativa, children, onClick }: { ativa: boolean; children: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`-mb-px border-b-2 px-5 py-3 text-sm font-black ${ativa ? "border-[#0257a0] text-[#0257a0]" : "border-transparent text-slate-400 hover:text-[#4e8afb]"}`}>{children}</button>; }

function FormularioEscola({ formulario, setFormulario, catalogo, onAdicionarBeneficio, onSolicitarExcluirBeneficio, onSalvar, onCancelar, processando }: { formulario: EscolaFormulario; setFormulario: React.Dispatch<React.SetStateAction<EscolaFormulario>>; catalogo: Beneficio[]; onAdicionarBeneficio: (nome: string) => Promise<void>; onSolicitarExcluirBeneficio: (beneficio: Beneficio) => void; onSalvar: () => Promise<void>; onCancelar: () => void; processando: boolean }) {
  const atualizar = <K extends keyof EscolaFormulario>(chave: K, valor: EscolaFormulario[K]) => setFormulario((atual) => ({ ...atual, [chave]: valor }));
  const atualizarTurno = (id: string, proximo: TurnoFormulario) => atualizar("turnos", formulario.turnos.map((turno) => turno.id === id ? proximo : turno));
  const niveisDisponiveis: Nivel[] = formulario.niveis.length ? formulario.niveis : ["Ensino Fundamental"];
  return <div className="mt-7 space-y-6"><Card titulo="Dados da Escola"><div className="grid grid-cols-2 gap-5"><Campo titulo="Nome da escola"><div className="mt-2 flex"><select value={formulario.sigla} onChange={(evento) => atualizar("sigla", evento.target.value)} className="rounded-l-xl border border-r-0 border-slate-300 bg-[#e6f0fa] px-3 font-black text-[#0257a0] outline-none"><>{SIGLAS.map((sigla) => <option key={sigla}>{sigla}</option>)}</></select><input value={formulario.nome} onChange={(evento) => atualizar("nome", evento.target.value)} className={`${input} mt-0 rounded-l-none`} placeholder="Nome da escola" /></div></Campo><Campo titulo="E-mail"><input type="email" value={formulario.email} onChange={(evento) => atualizar("email", evento.target.value)} className={input} placeholder="contato@escola.edu.br" /></Campo><Campo titulo="Cidade"><select value={formulario.cidade} onChange={(evento) => setFormulario((atual) => ({ ...atual, cidade: evento.target.value as EscolaFormulario["cidade"], bairro: "" }))} className={input}>{CIDADES.map((cidade) => <option key={cidade}>{cidade}</option>)}</select></Campo><Campo titulo="Bairro"><select value={formulario.bairro} onChange={(evento) => atualizar("bairro", evento.target.value)} className={input}><option value="">Selecione o bairro</option>{BAIRROS[formulario.cidade].map((bairro) => <option key={bairro}>{bairro}</option>)}</select></Campo><div className="col-span-2"><Campo titulo="Endereço completo"><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#4e8afb]" /><input value={formulario.endereco} onChange={(evento) => atualizar("endereco", evento.target.value)} className={`${input} pl-11`} placeholder="Rua, número e complemento" /></div></Campo></div><Campo titulo="Latitude"><input value={formulario.latitude} onChange={(evento) => atualizar("latitude", evento.target.value)} className={input} placeholder="-27.000000" inputMode="decimal" /></Campo><Campo titulo="Longitude"><input value={formulario.longitude} onChange={(evento) => atualizar("longitude", evento.target.value)} className={input} placeholder="-48.000000" inputMode="decimal" /></Campo></div></Card>
    <Card titulo="Níveis e Fotos" descricao="As fotos continuam hospedadas no GitHub: cole somente os links Raw."><div className="grid grid-cols-[0.7fr_1.3fr] gap-8"><div><p className="text-sm font-bold text-[#1e293b]">Níveis oferecidos</p><div className="mt-3 space-y-3">{(["Ensino Fundamental", "Ensino Médio"] as Nivel[]).map((nivel) => <label key={nivel} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold text-[#1e293b]"><input type="checkbox" checked={formulario.niveis.includes(nivel)} onChange={() => atualizar("niveis", formulario.niveis.includes(nivel) ? formulario.niveis.filter((item) => item !== nivel) : [...formulario.niveis, nivel])} className="size-4 accent-[#0257a0]" />{nivel}</label>)}</div></div><div><p className="text-sm font-bold text-[#1e293b]">Fotos (GitHub Raw)</p><div className="mt-3 space-y-3">{formulario.fotos.map((foto, indice) => <div key={`${indice}-${foto}`} className="flex items-center gap-2"><ImageIcon className="size-5 shrink-0 text-[#4e8afb]" /><input value={foto} onChange={(evento) => atualizar("fotos", formulario.fotos.map((item, posicao) => posicao === indice ? evento.target.value : item))} className={`${input} mt-0`} placeholder={`Link ${indice + 1}`} />{formulario.fotos.length > 1 && <button type="button" onClick={() => atualizar("fotos", formulario.fotos.filter((_, posicao) => posicao !== indice))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remover foto"><Trash2 className="size-5" /></button>}</div>)}</div><Botao variante="borda" onClick={() => atualizar("fotos", [...formulario.fotos, ""])} className="mt-4"><Plus className="size-4" />Adicionar outra foto</Botao></div></div></Card>
    <Card titulo="Turnos e Informações" descricao="Você pode incluir quantos turnos forem necessários para a mesma escola."><div className="space-y-5">{formulario.turnos.map((turno, indice) => <CartaoTurno key={turno.id} turno={turno} indice={indice} niveis={niveisDisponiveis} anterior={formulario.turnos[indice - 1]} catalogo={catalogo} onAdicionarBeneficio={onAdicionarBeneficio} onAtualizar={(proximo) => atualizarTurno(turno.id, proximo)} onRemover={() => atualizar("turnos", formulario.turnos.filter((item) => item.id !== turno.id))} onSolicitarExcluirBeneficio={onSolicitarExcluirBeneficio} />)}</div><Botao variante="borda" onClick={() => atualizar("turnos", [...formulario.turnos, novoTurno(niveisDisponiveis[0])])}><Plus className="size-4" />Adicionar turno</Botao></Card>
    <div className="flex justify-end gap-3 pb-10">{formulario.id && <Botao variante="borda" onClick={onCancelar}>Cancelar edição</Botao>}<Botao disabled={processando} onClick={() => void onSalvar()}><Check className="size-4" />{processando ? "Salvando..." : formulario.id ? "Salvar alterações" : "Cadastrar escola"}</Botao></div>
  </div>;
}

function CartaoTurno({ turno, indice, niveis, anterior, catalogo, onAdicionarBeneficio, onAtualizar, onRemover, onSolicitarExcluirBeneficio }: { turno: TurnoFormulario; indice: number; niveis: Nivel[]; anterior?: TurnoFormulario; catalogo: Beneficio[]; onAdicionarBeneficio: (nome: string) => Promise<void>; onAtualizar: (turno: TurnoFormulario) => void; onRemover: () => void; onSolicitarExcluirBeneficio: (beneficio: Beneficio) => void }) {
  const [novoBeneficio, setNovoBeneficio] = useState("");
  const selecionado = (id: string) => turno.beneficios.find((beneficio) => beneficio.beneficioId === id);
  const alternarBeneficio = (beneficio: Beneficio) => onAtualizar({ ...turno, beneficios: selecionado(beneficio.id) ? turno.beneficios.filter((item) => item.beneficioId !== beneficio.id) : [...turno.beneficios, { beneficioId: beneficio.id, descricaoLocal: beneficio.descricao }] });
  return <article className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between"><h3 className="font-black text-[#0257a0]">Turno {indice + 1}</h3><div className="flex items-center gap-3">{anterior && <button type="button" onClick={() => onAtualizar({ ...turno, comoFunciona: anterior.comoFunciona, beneficios: anterior.beneficios.map((beneficio) => ({ ...beneficio })) })} className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"><Copy className="size-3.5" />Copiar informações do turno anterior</button>}<button type="button" onClick={onRemover} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remover turno"><Trash2 className="size-5" /></button></div></div><div className="mt-5 grid grid-cols-3 gap-4"><Campo titulo="Nível deste turno"><select value={turno.nivel} onChange={(evento) => onAtualizar({ ...turno, nivel: evento.target.value as Nivel })} className={input}>{niveis.map((nivel) => <option key={nivel}>{nivel}</option>)}</select></Campo><Campo titulo="Turno"><select value={turno.turno} onChange={(evento) => onAtualizar({ ...turno, turno: evento.target.value as TurnoFormulario["turno"] })} className={input}><option>Manhã</option><option>Tarde</option><option>Noite</option></select></Campo><Campo titulo="Horário" dica={`Grava como: ${turno.inicio || "HH:MM"} - ${turno.fim || "HH:MM"}`}><div className="mt-2 flex items-center gap-2"><Clock3 className="size-4 shrink-0 text-[#4e8afb]" /><input type="time" value={turno.inicio} onChange={(evento) => onAtualizar({ ...turno, inicio: evento.target.value })} className="w-full rounded-xl border border-slate-300 px-2 py-2.5 font-normal outline-none focus:border-[#008bff]" /><span>–</span><input type="time" value={turno.fim} onChange={(evento) => onAtualizar({ ...turno, fim: evento.target.value })} className="w-full rounded-xl border border-slate-300 px-2 py-2.5 font-normal outline-none focus:border-[#008bff]" /></div></Campo></div><div className="mt-5 grid grid-cols-2 gap-4"><Campo titulo="Dias de aula" dica={`Grava como: ${abreviarDias(turno.diaInicio, turno.diaFim) || "Seg - Sex"}`}><div className="mt-2 flex items-center gap-2"><span className="text-sm font-normal text-slate-500">De</span><select value={turno.diaInicio} onChange={(evento) => onAtualizar({ ...turno, diaInicio: evento.target.value as Dia })} className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2.5 font-normal outline-none focus:border-[#008bff]"><option value="">–</option>{DIAS.map((dia) => <option key={dia}>{dia}</option>)}</select><span className="text-sm font-normal text-slate-500">a</span><select value={turno.diaFim} onChange={(evento) => onAtualizar({ ...turno, diaFim: evento.target.value as Dia })} className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2.5 font-normal outline-none focus:border-[#008bff]"><option value="">–</option>{DIAS.map((dia) => <option key={dia}>{dia}</option>)}</select></div></Campo><Campo titulo="Como funciona"><textarea rows={4} value={turno.comoFunciona} onChange={(evento) => onAtualizar({ ...turno, comoFunciona: evento.target.value })} className={input} placeholder="Descreva como funciona este turno" /></Campo></div><div className="mt-5 rounded-xl bg-[#f8fafc] p-4"><div className="flex items-center justify-between"><p className="text-sm font-black text-[#1e293b]">Benefícios</p><div className="flex items-center gap-2"><input value={novoBeneficio} onChange={(evento) => setNovoBeneficio(evento.target.value)} className="w-48 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-normal outline-none focus:border-[#008bff]" placeholder="Novo benefício global" /><button type="button" disabled={!novoBeneficio.trim()} onClick={() => { const nome = novoBeneficio.trim(); setNovoBeneficio(""); void onAdicionarBeneficio(nome); }} className="rounded-lg bg-[#e6f0fa] px-2 py-1.5 text-xs font-black text-[#0257a0] disabled:opacity-50"><Plus className="inline size-3" /> Adicionar</button></div></div><div className="mt-3 grid grid-cols-2 gap-3">{catalogo.map((beneficio) => { const marcado = selecionado(beneficio.id); return <div key={beneficio.id} className={`rounded-xl border p-3 ${marcado ? "border-[#4e8afb] bg-white" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1e293b]"><input type="checkbox" checked={Boolean(marcado)} onChange={() => alternarBeneficio(beneficio)} className="accent-[#0257a0]" />{beneficio.nome}</label><button type="button" onClick={() => onSolicitarExcluirBeneficio(beneficio)} className="text-slate-300 hover:text-red-500" title="Excluir de todas as escolas" aria-label="Excluir de todas as escolas"><Trash2 className="size-4" /></button></div>{marcado && <textarea rows={2} value={marcado.descricaoLocal} onChange={(evento) => onAtualizar({ ...turno, beneficios: turno.beneficios.map((item) => item.beneficioId === beneficio.id ? { ...item, descricaoLocal: evento.target.value } : item) })} className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-normal outline-none focus:border-[#008bff]" placeholder="Texto específico para este turno" />}</div>; })}</div></div></article>;
}

function FormularioRefinado({ formulario, setFormulario, catalogo, onAdicionarBeneficio, onSolicitarExcluirBeneficio, onSalvar, onCancelar, processando }: { formulario: EscolaFormulario; setFormulario: React.Dispatch<React.SetStateAction<EscolaFormulario>>; catalogo: Beneficio[]; onAdicionarBeneficio: (nome: string, descricao: string) => Promise<boolean>; onSolicitarExcluirBeneficio: (beneficio: Beneficio) => void; onSalvar: () => Promise<void>; onCancelar: () => void; processando: boolean }) {
  const [erros, setErros] = useState<Record<string, string>>({});
  const [modalBeneficio, setModalBeneficio] = useState(false);
  const [nomeBeneficio, setNomeBeneficio] = useState("");
  const [descricaoBeneficio, setDescricaoBeneficio] = useState("");
  const [errosBeneficio, setErrosBeneficio] = useState<Record<string, string>>({});
  const atualizar = <K extends keyof EscolaFormulario>(chave: K, valor: EscolaFormulario[K]) => {
    setFormulario((atual) => ({ ...atual, [chave]: valor }));
    setErros((atual) => { const { [chave]: _, ...restante } = atual; return restante; });
  };
  const atualizarTurno = (id: string, proximo: TurnoFormulario) => {
    atualizar("turnos", formulario.turnos.map((turno) => turno.id === id ? proximo : turno));
    setErros((atual) => {
      const restante = { ...atual };
      Object.keys(restante).filter((chave) => chave.startsWith(`turno-${id}-`)).forEach((chave) => delete restante[chave]);
      return restante;
    });
  };
  const niveisDisponiveis: Nivel[] = formulario.niveis.length ? formulario.niveis : ["Ensino Fundamental"];
  const validarESalvar = () => {
    const proximosErros: Record<string, string> = {};
    if (!formulario.nome.trim()) proximosErros.nome = "Informe o nome da escola.";
    if (!formulario.bairro) proximosErros.bairro = "Selecione o bairro.";
    if (!formulario.email.trim()) proximosErros.email = "Informe o e-mail da escola.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) proximosErros.email = "Informe um e-mail válido.";
    if (!formulario.latitude.trim() || !Number.isFinite(Number(formulario.latitude))) proximosErros.latitude = "Informe uma latitude válida.";
    if (!formulario.longitude.trim() || !Number.isFinite(Number(formulario.longitude))) proximosErros.longitude = "Informe uma longitude válida.";
    if (!formulario.niveis.length) proximosErros.niveis = "Selecione pelo menos um nível de ensino.";
    if (!formulario.turnos.length) proximosErros.turnos = "Adicione pelo menos um turno.";
    formulario.turnos.forEach((turno) => {
      if (!turno.inicio || !turno.fim) proximosErros[`turno-${turno.id}-horario`] = "Informe o horário de início e fim.";
      if (!turno.diaInicio || !turno.diaFim) proximosErros[`turno-${turno.id}-dias`] = "Informe os dias de aula.";
      if (!turno.comoFunciona.trim()) proximosErros[`turno-${turno.id}-descricao`] = "Explique como funciona este turno.";
    });
    setErros(proximosErros);
    if (Object.keys(proximosErros).length) return;
    void onSalvar();
  };
  const salvarBeneficio = async () => {
    const proximosErros: Record<string, string> = {};
    if (!nomeBeneficio.trim()) proximosErros.nome = "Informe o nome do benefício.";
    if (!descricaoBeneficio.trim()) proximosErros.descricao = "Informe uma descrição para o benefício.";
    setErrosBeneficio(proximosErros);
    if (Object.keys(proximosErros).length) return;
    const criado = await onAdicionarBeneficio(nomeBeneficio.trim(), descricaoBeneficio.trim());
    if (criado) {
      setNomeBeneficio(""); setDescricaoBeneficio(""); setErrosBeneficio({}); setModalBeneficio(false);
    }
  };
  const abrirModalBeneficio = () => { setErrosBeneficio({}); setModalBeneficio(true); };
  const control = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]";

  return <div className="mt-7 space-y-6">
    {Object.keys(erros).length > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Revise os campos destacados abaixo antes de salvar.</div>}
    <Card titulo="Dados da Escola" descricao="Preencha os dados de identificação e localização da unidade.">
      <div className="grid grid-cols-2 gap-5">
        <Campo titulo="Nome da escola" erro={erros.nome}>
          <div className="mt-2 flex min-w-0">
            <select value={formulario.sigla} onChange={(evento) => atualizar("sigla", evento.target.value)} className="h-11 w-28 shrink-0 rounded-l-xl border border-r-0 border-slate-300 bg-[#e6f0fa] px-2 text-sm font-black text-[#0257a0] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]">
              <option value="">Sem sigla</option>{SIGLAS.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
            </select>
            <input value={formulario.nome} onChange={(evento) => atualizar("nome", evento.target.value)} className="h-11 min-w-0 flex-1 rounded-r-xl border border-slate-300 bg-white px-3 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder="Nome da escola" />
          </div>
        </Campo>
        <Campo titulo="E-mail" erro={erros.email}><input type="email" value={formulario.email} onChange={(evento) => atualizar("email", evento.target.value)} className={control} placeholder="contato@escola.edu.br" /></Campo>
        <Campo titulo="Cidade"><select value={formulario.cidade} onChange={(evento) => { setFormulario((atual) => ({ ...atual, cidade: evento.target.value as EscolaFormulario["cidade"], bairro: "" })); setErros((atual) => { const { bairro: _, ...restante } = atual; return restante; }); }} className={control}>{CIDADES.map((cidade) => <option key={cidade} value={cidade}>{cidade}</option>)}</select></Campo>
        <Campo titulo="Bairro" erro={erros.bairro}><select value={formulario.bairro} onChange={(evento) => atualizar("bairro", evento.target.value)} className={control}><option value="">Selecione o bairro</option>{BAIRROS[formulario.cidade].map((bairro) => <option key={bairro} value={bairro}>{bairro}</option>)}</select></Campo>
        <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_9rem_minmax(0,0.8fr)] gap-4">
          <Campo titulo="Rua" dica="Opcional"><input value={formulario.rua} onChange={(evento) => atualizar("rua", evento.target.value)} className={control} placeholder="Ex.: Rua das Flores" /></Campo>
          <Campo titulo="Número" dica="Opcional"><input value={formulario.numero} onChange={(evento) => atualizar("numero", evento.target.value)} className={control} placeholder="Ex.: 120" /></Campo>
          <Campo titulo="Complemento" dica="Opcional"><input value={formulario.complemento} onChange={(evento) => atualizar("complemento", evento.target.value)} className={control} placeholder="Ex.: Bloco B" /></Campo>
        </div>
        <Campo titulo="Latitude" erro={erros.latitude}><input value={formulario.latitude} onChange={(evento) => atualizar("latitude", evento.target.value)} className={control} placeholder="-27.000000" inputMode="decimal" /></Campo>
        <Campo titulo="Longitude" erro={erros.longitude}><input value={formulario.longitude} onChange={(evento) => atualizar("longitude", evento.target.value)} className={control} placeholder="-48.000000" inputMode="decimal" /></Campo>
      </div>
    </Card>
    <Card titulo="Níveis e Fotos" descricao="As fotos continuam hospedadas no GitHub: cole somente os links Raw.">
      <div className="grid grid-cols-[0.7fr_1.3fr] gap-8">
        <div><p className="text-sm font-bold text-[#1e293b]">Níveis oferecidos</p><div className="mt-3 space-y-3">{(["Ensino Fundamental", "Ensino Médio"] as Nivel[]).map((nivel) => <label key={nivel} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#1e293b]"><input type="checkbox" checked={formulario.niveis.includes(nivel)} onChange={() => atualizar("niveis", formulario.niveis.includes(nivel) ? formulario.niveis.filter((item) => item !== nivel) : [...formulario.niveis, nivel])} className="size-4 accent-[#0257a0]" />{nivel}</label>)}</div>{erros.niveis && <p className="mt-2 text-xs font-bold text-red-600">{erros.niveis}</p>}</div>
        <div><p className="text-sm font-bold text-[#1e293b]">Fotos (GitHub Raw)</p><div className="mt-3 space-y-3">{formulario.fotos.map((foto, indice) => <div key={`${indice}-${foto}`} className="flex h-11 items-center gap-2"><ImageIcon className="size-5 shrink-0 text-[#4e8afb]" /><input value={foto} onChange={(evento) => atualizar("fotos", formulario.fotos.map((item, posicao) => posicao === indice ? evento.target.value : item))} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder={`Link ${indice + 1}`} />{formulario.fotos.length > 1 && <button type="button" onClick={() => atualizar("fotos", formulario.fotos.filter((_, posicao) => posicao !== indice))} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remover foto"><Trash2 className="size-5" /></button>}</div>)}</div><Botao variante="borda" onClick={() => atualizar("fotos", [...formulario.fotos, ""])} className="mt-4"><Plus className="size-4" />Adicionar outra foto</Botao></div>
      </div>
    </Card>
    <Card titulo="Turnos e Informações" descricao="Você pode incluir quantos turnos forem necessários para a mesma escola.">
      <div className="space-y-5">{formulario.turnos.map((turno, indice) => <CartaoTurnoRefinado key={turno.id} turno={turno} indice={indice} niveis={niveisDisponiveis} anterior={formulario.turnos[indice - 1]} catalogo={catalogo} erros={{ horario: erros[`turno-${turno.id}-horario`], dias: erros[`turno-${turno.id}-dias`], descricao: erros[`turno-${turno.id}-descricao`] }} onAtualizar={(proximo) => atualizarTurno(turno.id, proximo)} onRemover={() => atualizar("turnos", formulario.turnos.filter((item) => item.id !== turno.id))} onSolicitarExcluirBeneficio={onSolicitarExcluirBeneficio} onAbrirModalBeneficio={abrirModalBeneficio} />)}</div>
      {erros.turnos && <p className="mt-3 text-sm font-bold text-red-600">{erros.turnos}</p>}
      <Botao variante="borda" onClick={() => atualizar("turnos", [...formulario.turnos, novoTurno(niveisDisponiveis[0])])} className="mt-5"><Plus className="size-4" />Adicionar turno</Botao>
    </Card>
    <div className="flex justify-end gap-3 pb-10">{formulario.id && <Botao variante="borda" onClick={onCancelar}>Cancelar edição</Botao>}<Botao disabled={processando} onClick={validarESalvar}><Check className="size-4" />{processando ? "Salvando..." : formulario.id ? "Salvar alterações" : "Cadastrar escola"}</Botao></div>
    {modalBeneficio && <Modal titulo="Adicionar Benefício Padrão" onFechar={() => setModalBeneficio(false)}><p className="text-sm leading-6 text-slate-500">Este benefício padrão ficará disponível para as próximas escolas e turnos.</p><div className="mt-4 space-y-4"><Campo titulo="Nome do Benefício" erro={errosBeneficio.nome}><input value={nomeBeneficio} onChange={(evento) => setNomeBeneficio(evento.target.value)} className={control} placeholder="Ex.: Transporte escolar" /></Campo><Campo titulo="Descrição" erro={errosBeneficio.descricao}><textarea rows={4} value={descricaoBeneficio} onChange={(evento) => setDescricaoBeneficio(evento.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder="Explique o benefício oferecido" /></Campo></div><div className="mt-5 flex justify-end gap-3"><Botao variante="borda" onClick={() => setModalBeneficio(false)}>Cancelar</Botao><Botao disabled={processando} onClick={() => void salvarBeneficio()}><Check className="size-4" />Salvar</Botao></div></Modal>}
  </div>;
}

function CartaoTurnoRefinado({ turno, indice, niveis, anterior, catalogo, erros, onAtualizar, onRemover, onSolicitarExcluirBeneficio, onAbrirModalBeneficio }: { turno: TurnoFormulario; indice: number; niveis: Nivel[]; anterior?: TurnoFormulario; catalogo: Beneficio[]; erros: { horario?: string; dias?: string; descricao?: string }; onAtualizar: (turno: TurnoFormulario) => void; onRemover: () => void; onSolicitarExcluirBeneficio: (beneficio: Beneficio) => void; onAbrirModalBeneficio: () => void }) {
  const selecionado = (id: string) => turno.beneficios.find((beneficio) => beneficio.beneficioId === id);
  const alternarBeneficio = (beneficio: Beneficio) => onAtualizar({ ...turno, beneficios: selecionado(beneficio.id) ? turno.beneficios.filter((item) => item.beneficioId !== beneficio.id) : [...turno.beneficios, { beneficioId: beneficio.id, descricaoLocal: beneficio.descricao }] });
  const control = "mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]";
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(2,87,160,0.25)]"><div className="flex items-center justify-between gap-4"><h3 className="font-black text-[#0257a0]">Turno {indice + 1}</h3><div className="flex items-center gap-3">{anterior && <button type="button" onClick={() => onAtualizar({ ...turno, comoFunciona: anterior.comoFunciona, beneficios: anterior.beneficios.map((beneficio) => ({ ...beneficio })) })} className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"><Copy className="size-3.5" />Copiar informações do turno anterior</button>}<button type="button" onClick={onRemover} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Remover turno"><Trash2 className="size-5" /></button></div></div><div className="mt-5 grid grid-cols-3 gap-4"><Campo titulo="Nível deste turno"><select value={turno.nivel} onChange={(evento) => onAtualizar({ ...turno, nivel: evento.target.value as Nivel })} className={control}>{niveis.map((nivel) => <option key={nivel} value={nivel}>{nivel}</option>)}</select></Campo><Campo titulo="Turno"><select value={turno.turno} onChange={(evento) => onAtualizar({ ...turno, turno: evento.target.value as TurnoFormulario["turno"] })} className={control}><option>Manhã</option><option>Tarde</option><option>Noite</option></select></Campo><Campo titulo="Horário" dica={`Grava como: ${turno.inicio || "HH:MM"} - ${turno.fim || "HH:MM"}`} erro={erros.horario}><div className="mt-2 flex h-11 items-center gap-2"><Clock3 className="size-4 shrink-0 text-[#4e8afb]" /><input type="time" value={turno.inicio} onChange={(evento) => onAtualizar({ ...turno, inicio: evento.target.value })} className="h-11 w-full rounded-xl border border-slate-300 px-2 font-normal outline-none focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" /><span>–</span><input type="time" value={turno.fim} onChange={(evento) => onAtualizar({ ...turno, fim: evento.target.value })} className="h-11 w-full rounded-xl border border-slate-300 px-2 font-normal outline-none focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" /></div></Campo></div><div className="mt-5 grid grid-cols-2 gap-4"><Campo titulo="Dias de aula" dica={`Grava como: ${abreviarDias(turno.diaInicio, turno.diaFim) || "Seg - Sex"}`} erro={erros.dias}><div className="mt-2 flex h-11 items-center gap-2"><span className="text-sm font-normal text-slate-500">De</span><select value={turno.diaInicio} onChange={(evento) => onAtualizar({ ...turno, diaInicio: evento.target.value as Dia })} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-2 font-normal outline-none focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]"><option value="">–</option>{DIAS.map((dia) => <option key={dia} value={dia}>{dia}</option>)}</select><span className="text-sm font-normal text-slate-500">a</span><select value={turno.diaFim} onChange={(evento) => onAtualizar({ ...turno, diaFim: evento.target.value as Dia })} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-2 font-normal outline-none focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]"><option value="">–</option>{DIAS.map((dia) => <option key={dia} value={dia}>{dia}</option>)}</select></div></Campo><Campo titulo="Como funciona" erro={erros.descricao}><textarea rows={4} value={turno.comoFunciona} onChange={(evento) => onAtualizar({ ...turno, comoFunciona: evento.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-[#1e293b] outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder="Descreva como funciona este turno" /></Campo></div><div className="mt-5 rounded-xl bg-[#f8fafc] p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-black text-[#1e293b]">Benefícios</p><Botao onClick={onAbrirModalBeneficio} className="!px-3 !py-2"><Plus className="size-4" />Adicionar Benefício Padrão</Botao></div><div className="mt-3 grid grid-cols-2 gap-3">{catalogo.map((beneficio) => { const marcado = selecionado(beneficio.id); return <div key={beneficio.id} className={`rounded-xl border p-3 ${marcado ? "border-[#4e8afb] bg-white" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1e293b]"><input type="checkbox" checked={Boolean(marcado)} onChange={() => alternarBeneficio(beneficio)} className="accent-[#0257a0]" />{beneficio.nome}</label><button type="button" onClick={() => onSolicitarExcluirBeneficio(beneficio)} className="text-slate-300 hover:text-red-500" title="Excluir de todas as escolas" aria-label="Excluir de todas as escolas"><Trash2 className="size-4" /></button></div>{marcado && <textarea rows={2} value={marcado.descricaoLocal} onChange={(evento) => onAtualizar({ ...turno, beneficios: turno.beneficios.map((item) => item.beneficioId === beneficio.id ? { ...item, descricaoLocal: evento.target.value } : item) })} className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-normal outline-none focus:border-[#008bff]" placeholder="Texto específico para este turno" />}</div>; })}</div></div></article>;
}

function ListaEscolasAprimorada({ carregando, escolas, busca, setBusca, onEditar, onAlternarAtiva, onExcluir }: { carregando: boolean; escolas: EscolaFormulario[]; busca: string; setBusca: (valor: string) => void; onEditar: (escola: EscolaFormulario) => void; onAlternarAtiva: (id: string | null) => void; onExcluir: (escola: EscolaFormulario) => void }) {
  return <div className="mt-7"><div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} className={`${input} mt-0 pl-10`} placeholder="Buscar por nome, cidade ou bairro" /></div><div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(2,87,160,0.14)]"><table className="w-full text-left text-sm"><thead className="bg-[#e6f0fa] text-[#0257a0]"><tr><th className="px-5 py-4 font-black">Escola</th><th className="px-5 py-4 font-black">Localização</th><th className="px-5 py-4 font-black">Níveis</th><th className="px-5 py-4 font-black">Turnos</th><th className="px-5 py-4 text-right font-black">Ações</th></tr></thead><tbody>{carregando ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Carregando escolas...</td></tr> : escolas.length ? escolas.map((escola) => <tr key={escola.id ?? escola.nome} className="border-t border-slate-100"><td className="px-5 py-4 font-bold text-[#1e293b]">{escola.sigla ? `[${escola.sigla}] ` : ""}{escola.nome}</td><td className="px-5 py-4 text-slate-500">{escola.cidade} · {escola.bairro}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{escola.niveis.map((nivel) => <span key={nivel} className="rounded-md bg-[#e6f0fa] px-2 py-1 text-xs font-bold text-[#0257a0]">{nivel.replace("Ensino ", "")}</span>)}</div></td><td className="px-5 py-4 text-slate-500">{escola.turnos.length}</td><td className="px-5 py-4"><div className="flex items-center justify-end gap-3"><button type="button" onClick={() => onAlternarAtiva(escola.id)} className={`relative h-6 w-11 rounded-full transition focus:outline-none focus:ring-4 focus:ring-[#d6e8fa] ${escola.ativa ? "bg-[#07aa43]" : "bg-slate-300"}`} aria-label={escola.ativa ? "Desativar escola no mapa" : "Ativar escola no mapa"} title={escola.ativa ? "Visível no mapa — clique para ocultar" : "Oculta no mapa — clique para exibir"} aria-pressed={escola.ativa}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${escola.ativa ? "left-6" : "left-1"}`} /></button><button type="button" onClick={() => onEditar(escola)} className="inline-flex items-center gap-1 text-xs font-black text-[#008bff] hover:text-[#0257a0]"><FilePenLine className="size-3.5" />Editar</button><button type="button" onClick={() => onExcluir(escola)} className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-800"><Trash2 className="size-3.5" />Excluir</button></div></td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">Nenhuma escola encontrada.</td></tr>}</tbody></table></div></div>;
}

function ListaEscolas({ carregando, escolas, busca, setBusca, onEditar, onAlternarAtiva, onExcluir }: { carregando: boolean; escolas: EscolaFormulario[]; busca: string; setBusca: (valor: string) => void; onEditar: (escola: EscolaFormulario) => void; onAlternarAtiva: (id: string | null) => void; onExcluir: (escola: EscolaFormulario) => void }) {
  return <div className="mt-7"><div className="relative max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} className={`${input} mt-0 pl-10`} placeholder="Buscar por nome, cidade ou bairro" /></div><div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-8px_rgba(2,87,160,0.14)]"><table className="w-full text-left text-sm"><thead className="bg-[#e6f0fa] text-[#0257a0]"><tr><th className="px-5 py-4 font-black">Escola</th><th className="px-5 py-4 font-black">Localização</th><th className="px-5 py-4 font-black">Níveis</th><th className="px-5 py-4 font-black">Turnos</th><th className="px-5 py-4 font-black">Ativa</th><th className="px-5 py-4 text-right font-black">Ações</th></tr></thead><tbody>{carregando ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Carregando escolas...</td></tr> : escolas.length ? escolas.map((escola) => <tr key={escola.id ?? escola.nome} className="border-t border-slate-100"><td className="px-5 py-4 font-bold text-[#1e293b]">{escola.sigla ? `[${escola.sigla}] ` : ""}{escola.nome}</td><td className="px-5 py-4 text-slate-500">{escola.cidade} · {escola.bairro}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{escola.niveis.map((nivel) => <span key={nivel} className="rounded-md bg-[#e6f0fa] px-2 py-1 text-xs font-bold text-[#0257a0]">{nivel.replace("Ensino ", "")}</span>)}</div></td><td className="px-5 py-4 text-slate-500">{escola.turnos.length}</td><td className="px-5 py-4"><button type="button" onClick={() => onAlternarAtiva(escola.id)} className={`relative h-6 w-11 rounded-full transition ${escola.ativa ? "bg-[#07aa43]" : "bg-slate-300"}`} aria-label={escola.ativa ? "Desativar escola" : "Ativar escola"} aria-pressed={escola.ativa}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${escola.ativa ? "left-6" : "left-1"}`} /></button></td><td className="px-5 py-4"><div className="flex justify-end gap-3"><button type="button" onClick={() => onEditar(escola)} className="inline-flex items-center gap-1 text-xs font-black text-[#008bff] hover:text-[#0257a0]"><FilePenLine className="size-3.5" />Editar</button><button type="button" onClick={() => onExcluir(escola)} className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-800"><Trash2 className="size-3.5" />Excluir</button></div></td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Nenhuma escola encontrada.</td></tr>}</tbody></table></div></div>;
}
