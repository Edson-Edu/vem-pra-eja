"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { Award, GraduationCap, Laptop, MapPin, Moon, Play, School2, Smartphone, Sparkles, Tablet, Users, X } from "lucide-react";
import { carregarDadosAdministrativos, carregarInscricoesAdministrativas, type InscricaoAdministrativa } from "../lib/admin-escolas";
import type { EstatisticasAnalytics } from "../lib/analytics-admin";

type Periodo = "Hoje" | "Últimos 7 dias" | "Mês" | "Personalizado";
type Linha = { nome: string; total: number };
type Layout = "centro" | "esquerda" | "direita";
type EscolaComFoto = { id: string; nome: string; fotos: string[] };

function intervaloDoPeriodo(periodo: Periodo, inicio: string, fim: string) {
  const agora = new Date();
  const iso = (data: Date) => data.toISOString().slice(0, 10);
  if (periodo === "Hoje") return { inicio: iso(agora), fim: iso(agora) };
  if (periodo === "Últimos 7 dias") { const desde = new Date(agora); desde.setDate(agora.getDate() - 6); return { inicio: iso(desde), fim: iso(agora) }; }
  if (periodo === "Mês") return { inicio: `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-01`, fim: iso(agora) };
  return inicio && fim ? { inicio, fim } : null;
}

function inscricoesDoPeriodo(linhas: InscricaoAdministrativa[], periodo: Periodo, inicio: string, fim: string) {
  const intervalo = intervaloDoPeriodo(periodo, inicio, fim);
  if (!intervalo) return [];
  const inicioDoDia = new Date(intervalo.inicio + "T00:00:00").getTime();
  const fimDoDia = new Date(intervalo.fim + "T23:59:59").getTime();
  return linhas.filter((linha) => {
    const data = new Date(linha.criadaEm).getTime();
    return !Number.isNaN(data) && data >= inicioDoDia && data <= fimDoDia;
  });
}

function principal(linhas: InscricaoAdministrativa[], campo: (linha: InscricaoAdministrativa) => string, vazio: string) {
  const totais = new Map<string, number>();
  linhas.forEach((linha) => {
    const nome = campo(linha).trim();
    if (nome) totais.set(nome, (totais.get(nome) ?? 0) + 1);
  });
  return [...totais.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? vazio;
}

function principalLinha(linhas: Linha[], vazio: string) {
  return [...linhas].sort((a, b) => b.total - a.total)[0]?.nome ?? vazio;
}

function rotuloDispositivo(valor: string) {
  const normalizado = valor.toLowerCase();
  if (normalizado.includes("mobile") || normalizado.includes("celular")) return "Celular";
  if (normalizado.includes("tablet")) return "Tablet";
  if (normalizado.includes("desktop") || normalizado.includes("computador")) return "Computador";
  return valor || "Celular";
}

function rotuloHora(valor: string) {
  const encontrado = valor.match(/(\d{1,2})/);
  return encontrado ? `${encontrado[1].padStart(2, "0")}h` : "19h";
}

function NumeroAnimado({ valor }: { valor: number }) {
  const [numero, setNumero] = useState(0);
  useEffect(() => {
    setNumero(0);
    const controle = animate(0, Math.max(valor, 0), {
      duration: 1.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (atual) => setNumero(Math.round(atual)),
    });
    return () => controle.stop();
  }, [valor]);
  return <motion.span initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 180, damping: 16 }} className="inline-block text-[#008bff] [text-shadow:0_0_28px_rgba(0,139,255,0.44)]">{numero.toLocaleString("pt-BR")}</motion.span>;
}

function TextoRevelado({ texto }: { texto: string }) {
  return <motion.span variants={{ oculto: {}, visivel: { transition: { staggerChildren: 0.055, delayChildren: 0.15 } } }} initial="oculto" animate="visivel">{texto.split(" ").filter(Boolean).map((palavra, indice) => <motion.span key={`${palavra}-${indice}`} variants={{ oculto: { y: 28, opacity: 0 }, visivel: { y: 0, opacity: 1, transition: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } } }} className="mr-[0.28em] inline-block">{palavra}</motion.span>)}</motion.span>;
}

function ElementoVisual({ tipo, Icon }: { tipo: string; Icon: typeof Sparkles }) {
  const gradientes: Record<string, string> = {
    inscricao: "from-[#008bff] via-[#4e8afb] to-[#0257a0]",
    noite: "from-[#0257a0] via-[#4e8afb] to-[#008bff]",
    bairro: "from-[#008bff] via-[#0257a0] to-[#4e8afb]",
  };
  return <motion.div animate={{ y: [0, -16, 0], rotate: [0, 2, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} className="relative mx-auto grid aspect-square w-full max-w-[480px] place-items-center">
    <motion.i animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.9, 0.55] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className={["absolute inset-[7%] rounded-[38%] bg-gradient-to-br blur-[2px]", gradientes[tipo] ?? gradientes.inscricao].join(" ")} />
    <i className="absolute inset-[19%] rounded-full border border-[#e6f0fa]/60" />
    <i className="absolute inset-[31%] rounded-full border border-[#d6e8fa]/70" />
    <motion.i animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-[#e6f0fa]/50" />
    <span className="relative grid size-44 place-items-center rounded-[2.5rem] border border-white/45 bg-white/15 shadow-[0_0_80px_rgba(0,139,255,0.48)] backdrop-blur-sm"><Icon className="size-20 text-white" strokeWidth={1.4} /></span>
  </motion.div>;
}

function FotoDaEscola({ foto, nome }: { foto: string; nome: string }) {
  if (!foto) return <ElementoVisual tipo="bairro" Icon={School2} />;
  return <motion.figure initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto w-full max-w-[590px]">
    <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="overflow-hidden rounded-[2.4rem] border border-white/35 bg-[#e6f0fa] p-2 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.7)]">
      <img src={foto} alt={`Foto da ${nome}`} className="aspect-[16/10] w-full rounded-[1.9rem] object-cover" />
    </motion.div>
    <figcaption className="absolute -bottom-5 left-8 rounded-xl border border-white/35 bg-[#0257a0] px-5 py-3 text-sm font-black text-white shadow-xl">Escola com mais inscrições</figcaption>
  </motion.figure>;
}

function DispositivosVisuais({ dispositivo }: { dispositivo: string }) {
  const computador = dispositivo === "Computador";
  const tablet = dispositivo === "Tablet";
  const IconePrincipal = computador ? Laptop : tablet ? Tablet : Smartphone;
  const nome = computador ? "computador" : tablet ? "tablet" : "celular";
  return <div className="relative mx-auto flex h-[390px] w-full max-w-[560px] items-center justify-center">
    <motion.div initial={{ opacity: 0, scale: 0.78, filter: "blur(12px)" }} animate={{ opacity: [0, 1, 0], scale: [0.78, 1, 0.92], filter: ["blur(12px)", "blur(0px)", "blur(6px)"] }} transition={{ duration: 1.55, times: [0, 0.35, 1], ease: [0.16, 1, 0.3, 1] }} className="absolute grid size-40 place-items-center rounded-full border border-white/35 bg-white/10 text-7xl font-black text-[#e6f0fa]">?</motion.div>
    <motion.div initial={{ opacity: 0, y: 52, scale: 0.68 }} animate={{ opacity: 1, y: [18, -10, 0], scale: [0.68, 1.08, 1] }} transition={{ delay: 1.15, duration: 1.05, ease: [0.16, 1, 0.3, 1] }} className="relative grid size-[300px] place-items-center rounded-[4rem] border border-white/45 bg-gradient-to-br from-[#008bff] to-[#4e8afb] shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
      <motion.i animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} className="absolute -inset-7 rounded-[5rem] border border-[#e6f0fa]/60" />
      <IconePrincipal className={["relative text-white", computador ? "size-40" : tablet ? "size-36" : "size-32"].join(" ")} strokeWidth={1.15} />
    </motion.div>
    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.05, duration: 0.5 }} className="absolute -bottom-2 rounded-xl border border-white/30 bg-white/15 px-5 py-3 text-lg font-black text-[#e6f0fa]">Aparelho mais usado: <span className="text-white">{nome}</span></motion.p>
  </div>;
}

type RetrospectivaProps = {
  dados: EstatisticasAnalytics;
  periodo: Periodo;
  inicio: string;
  fim: string;
  textoDoPeriodo: string;
  aoFechar: () => void;
};

export default function RetrospectivaAcessos({ dados, periodo, inicio, fim, textoDoPeriodo, aoFechar }: RetrospectivaProps) {
  const [indice, setIndice] = useState(0);
  const [inscricoes, setInscricoes] = useState<InscricaoAdministrativa[]>([]);
  const [escolas, setEscolas] = useState<EscolaComFoto[]>([]);

  useEffect(() => {
    let ativo = true;
    Promise.all([carregarInscricoesAdministrativas(), carregarDadosAdministrativos()]).then(([linhas, administracao]) => {
      if (!ativo) return;
      setInscricoes(inscricoesDoPeriodo(linhas, periodo, inicio, fim));
      setEscolas(administracao.escolas.map((escola) => ({ id: escola.id ?? "", nome: escola.nome, fotos: escola.fotos.filter(Boolean) })));
    }).catch(() => { if (ativo) { setInscricoes([]); setEscolas([]); } });
    return () => { ativo = false; };
  }, [periodo, inicio, fim]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setIndice((atual) => (atual + 1) % 8), 6000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const fechar = (evento: KeyboardEvent) => { if (evento.key === "Escape") aoFechar(); };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aoFechar]);

  const dadosDaHistoria = useMemo(() => {
    const combinacoes = new Map<string, number>();
    inscricoes.forEach((inscricao) => {
      const chave = `${inscricao.nivel}|${inscricao.turno}`;
      if (inscricao.nivel || inscricao.turno) combinacoes.set(chave, (combinacoes.get(chave) ?? 0) + 1);
    });
    const favorita = [...combinacoes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0].split("|") ?? ["Ensino", "Noite"];
    const totaisPorEscola = new Map<string, { nome: string; total: number }>();
    inscricoes.forEach((inscricao) => {
      if (!inscricao.escolaId) return;
      const atual = totaisPorEscola.get(inscricao.escolaId);
      totaisPorEscola.set(inscricao.escolaId, { nome: inscricao.escola, total: (atual?.total ?? 0) + 1 });
    });
    const escolaPrincipal = [...totaisPorEscola.entries()].sort((a, b) => b[1].total - a[1].total)[0];
    const escola = escolaPrincipal?.[1].nome ?? "Ainda sem inscrições";
    const foto = escolaPrincipal ? escolas.find((item) => item.id === escolaPrincipal[0])?.fotos[0] ?? "" : "";
    return {
      visitas: dados.resumo.visitas ?? 0,
      concluidas: dados.resumo.concluiuInscricao ?? 0,
      escola,
      foto,
      nivel: favorita[0] || "Ensino",
      turno: favorita[1] || "Noite",
      bairro: principal(inscricoes, (item) => item.bairro, "Ainda não informado"),
      horario: rotuloHora(principalLinha(dados.acessos.horarios, "19")),
      dispositivo: rotuloDispositivo(principalLinha(dados.acessos.dispositivos, "mobile")),
    };
  }, [dados, escolas, inscricoes]);

  const slides: Array<{ id: string; layout: Layout; Icon: typeof Sparkles; tipo: string }> = [
    { id: "abertura", layout: "centro", Icon: Sparkles, tipo: "abertura" },
    { id: "visitas", layout: "centro", Icon: Users, tipo: "visitas" },
    { id: "inscricoes", layout: "esquerda", Icon: Award, tipo: "inscricao" },
    { id: "escola", layout: "direita", Icon: School2, tipo: "escola" },
    { id: "favorita", layout: "esquerda", Icon: Moon, tipo: "noite" },
    { id: "bairro", layout: "direita", Icon: MapPin, tipo: "bairro" },
    { id: "dispositivo", layout: "centro", Icon: Smartphone, tipo: "dispositivo" },
    { id: "final", layout: "centro", Icon: GraduationCap, tipo: "final" },
  ];
  const slide = slides[indice];

  const tituloGrande = "max-w-5xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-white xl:text-6xl 2xl:text-7xl";
  const frase = () => {
    if (slide.id === "abertura") return <div className="text-center"><motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 15 }} className="mx-auto mb-8 grid size-24 place-items-center rounded-[2rem] border border-white/35 bg-white/15 shadow-[0_0_70px_rgba(0,139,255,0.55)]"><Sparkles className="size-11 text-[#e6f0fa]" /></motion.div><h2 className="text-6xl font-black tracking-[-0.055em] text-white 2xl:text-8xl">Vem pra EJA<br /><span className="text-[#008bff]">em números.</span></h2><motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.42 }} className="mx-auto mt-7 max-w-2xl text-xl leading-8 text-[#e6f0fa]">Uma retrospectiva sobre as pessoas que buscaram novas oportunidades pelo estudo.</motion.p></div>;
    if (slide.id === "visitas") return <p className={tituloGrande}><TextoRevelado texto="No período selecionado," /> <NumeroAnimado valor={dadosDaHistoria.visitas} /> <TextoRevelado texto="pessoas acessaram a plataforma em busca de concluir seus estudos." /></p>;
    if (slide.id === "inscricoes") return <p className={tituloGrande}><TextoRevelado texto="Desses," /> <NumeroAnimado valor={dadosDaHistoria.concluidas} /> <TextoRevelado texto="realizaram a inscrição! Seja garantindo a própria vaga ou inscrevendo um amigo ou familiar." /></p>;
    if (slide.id === "escola") return <p className={tituloGrande}><TextoRevelado texto="A escola com mais inscrições no período foi" /> <span className="inline-block text-[#008bff] [text-shadow:0_0_28px_rgba(0,139,255,0.44)]">{dadosDaHistoria.escola}</span><span>.</span></p>;
    if (slide.id === "favorita") return <div><p className="mb-7 text-xl font-bold text-[#d6e8fa]"><TextoRevelado texto="Entre as pessoas que concluíram a inscrição," /></p><p className={tituloGrande}><span className="text-[#008bff]">{dadosDaHistoria.nivel}</span> <TextoRevelado texto="no turno da" /> <span className="text-[#008bff]">{dadosDaHistoria.turno}</span> <TextoRevelado texto="foi a combinação mais escolhida." /></p></div>;
    if (slide.id === "bairro") return <p className={tituloGrande}><TextoRevelado texto="A região que mais teve alunos se inscrevendo foi o bairro" /> <span className="inline-block text-[#008bff]">{dadosDaHistoria.bairro}</span><span>.</span></p>;
    if (slide.id === "dispositivo") return <div className="text-center"><p className={tituloGrande}><TextoRevelado texto="O horário mais comum para iniciar a inscrição foi por volta das" /> <span className="text-[#008bff]">{dadosDaHistoria.horario}</span>.</p><p className="mx-auto mt-7 max-w-4xl text-2xl font-bold leading-9 text-[#e6f0fa]"><TextoRevelado texto="E o acesso aconteceu principalmente pelo" /> <span className="text-white">{dadosDaHistoria.dispositivo}</span>.</p></div>;
    return <div className="text-center"><motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 15 }} className="mx-auto mb-8 grid size-24 place-items-center rounded-[2rem] border border-white/35 bg-white/15"><GraduationCap className="size-12 text-[#e6f0fa]" /></motion.div><h2 className="max-w-5xl text-balance text-5xl font-black leading-[1.03] tracking-[-0.055em] text-white xl:text-7xl">Cada número representa uma <span className="text-[#008bff]">nova oportunidade.</span></h2></div>;
  };

  const visual = () => {
    if (slide.id === "escola") return <FotoDaEscola foto={dadosDaHistoria.foto} nome={dadosDaHistoria.escola} />;
    if (slide.id === "dispositivo") return <DispositivosVisuais dispositivo={dadosDaHistoria.dispositivo} />;
    return <ElementoVisual tipo={slide.tipo} Icon={slide.Icon} />;
  };

  const conteudo = slide.layout === "centro"
    ? <div className="flex h-full flex-col items-center justify-center px-12 text-center">{slide.id === "dispositivo" ? <><div className="mb-2">{frase()}</div><div className="mt-5">{visual()}</div></> : <>{frase()} {slide.id === "visitas" && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.72 }} transition={{ delay: 1.1 }} className="mt-10 max-w-2xl text-lg leading-7 text-[#e6f0fa]">Cada acesso representa alguém dando um passo em direção a novas oportunidades.</motion.p>}</>}</div>
    : <div className={["grid h-full items-center gap-12 px-16 xl:grid-cols-2", slide.layout === "direita" ? "xl:[&>*:first-child]:order-2" : ""].join(" ")}><div className={slide.layout === "direita" ? "xl:text-right xl:justify-self-end" : ""}>{frase()}</div>{visual()}</div>;

  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] overflow-hidden bg-[#0257a0] text-white">
    <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_15%_20%,rgba(0,139,255,0.65),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(78,138,251,0.42),transparent_26%)]" />
    <div className="absolute inset-x-0 top-0 z-20 flex gap-2 px-10 pt-7">{slides.map((item, itemIndice) => <button key={item.id} type="button" onClick={() => setIndice(itemIndice)} aria-label={`Ir para parte ${itemIndice + 1}`} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">{itemIndice === indice && <motion.i key={`${item.id}-progresso`} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 6, ease: "linear" }} className="block h-full bg-[#e6f0fa] shadow-[0_0_10px_#e6f0fa]" />}{itemIndice < indice && <i className="block h-full w-full bg-[#e6f0fa]" />}</button>)}</div>
    <button type="button" onClick={aoFechar} className="absolute right-9 top-12 z-30 grid size-11 place-items-center rounded-full border border-white/35 bg-white/15 text-white transition hover:scale-105 hover:bg-white/25" aria-label="Fechar retrospectiva"><X className="size-5" /></button>
    <div className="absolute left-10 top-14 z-20 flex items-center gap-3 text-sm font-black tracking-wide text-[#e6f0fa]"><span className="grid size-9 place-items-center rounded-xl bg-[#008bff] shadow-[0_0_24px_rgba(0,139,255,0.7)]"><Play className="size-4 fill-white" /></span>RETROSPECTIVA <span className="font-medium text-white/70">• {textoDoPeriodo}</span></div>
    <AnimatePresence mode="wait"><motion.div key={slide.id} initial={{ opacity: 0, y: 34, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -24, filter: "blur(7px)" }} transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 h-full pt-20">{conteudo}</motion.div></AnimatePresence>
    <div className="absolute bottom-9 left-10 z-20 flex items-center gap-3 text-xs font-bold text-white/75"><GraduationCap className="size-4" />Vem pra EJA <span className="size-1 rounded-full bg-[#e6f0fa]" /> dados do período selecionado</div>
    <div className="absolute bottom-9 right-10 z-20 text-sm font-black text-white/75">{String(indice + 1).padStart(2, "0")} <span className="font-medium">/ {String(slides.length).padStart(2, "0")}</span></div>
  </motion.div></AnimatePresence>;
}
