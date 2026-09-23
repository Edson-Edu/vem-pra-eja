"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, BookOpenCheck, BookX, Bus, ChevronRight, GraduationCap, HeartHandshake, Info, Utensils, X } from "lucide-react";
import { buscarEscolas } from "../lib/supabase-client";
import BotaoAudio from "./BotaoAudio";
import CabecalhoFluxo from "./CabecalhoFluxo";
import { textoParaAudio, useAudioDescricao } from "./useAudioDescricao";

type Nivel = {
  titulo: string;
  subtitulo: string;
  filtro: "Ensino Fundamental" | "Ensino Médio";
  icone: typeof BookOpen;
};

const niveis: Nivel[] = [
  { titulo: "Nunca estudei", subtitulo: "Não cheguei a frequentar a escola formalmente.", filtro: "Ensino Fundamental", icone: BookX },
  { titulo: "Ensino Fundamental\n(1º Grau)", subtitulo: "Do 1º ao 5º ano (antigo Primário) e do 6º ao 9º ano (antigo Ginásio).", filtro: "Ensino Fundamental", icone: BookOpen },
  { titulo: "Ensino Médio\n(2º Grau)", subtitulo: "Já concluí o 1º Grau (Fundamental) e quero cursar o 2º Grau (Médio).", filtro: "Ensino Médio", icone: GraduationCap },
];

type Props = { onVoltar: () => void; onEscolher: (nivel: Nivel["filtro"]) => void };
const pergunta = "Até que série ou ano você estudou?";
const instrucao = "Toque em uma opção para continuar.";
const pacoteDaOpcao = (nivel: Nivel, indice: number) => `Opção ${indice + 1}: ${textoParaAudio(nivel.titulo.replace("\n", ", "))}. ${nivel.subtitulo}`;
const leituraCompleta = `Etapa 1 de 4: Nível. ${pergunta} ${instrucao} ${niveis.map(pacoteDaOpcao).join(" ")} Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir os estudos.`;

export default function TelaNivel({ onVoltar, onEscolher }: Props) {
  const { ativo, falarAgora, interromper } = useAudioDescricao();
  const [disponibilidade, setDisponibilidade] = useState<Partial<Record<Nivel["filtro"], boolean>>>({});
  const [aviso, setAviso] = useState<{ texto: string; libras: string } | null>(null);
  const consultando = useRef(false);
  const fecharAviso = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelado = false;
    const atualizar = () => {
      for (const filtro of ["Ensino Fundamental", "Ensino Médio"] as const) {
        void buscarEscolas(filtro).then((escolas) => {
          if (!cancelado) setDisponibilidade((atual) => ({ ...atual, [filtro]: escolas.length > 0 }));
        }).catch(() => { /* Falha de conexão não significa ausência de escolas. */ });
      }
    };
    atualizar();
    window.addEventListener("focus", atualizar);
    const intervalo = window.setInterval(atualizar, 30000);
    return () => { cancelado = true; window.clearInterval(intervalo); window.removeEventListener("focus", atualizar); };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const anterior = document.activeElement as HTMLElement | null;
    fecharAviso.current?.focus();
    return () => anterior?.focus();
  }, [aviso]);

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraCompleta), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora]);

  const escolher = async (nivel: Nivel) => {
    if (consultando.current) return;
    interromper();
    consultando.current = true;
    try {
      // Confere novamente no clique, inclusive quando o administrador reativa uma escola.
      const escolas = await buscarEscolas(nivel.filtro);
      setDisponibilidade((atual) => ({ ...atual, [nivel.filtro]: escolas.length > 0 }));
      if (escolas.length) { onEscolher(nivel.filtro); return; }
      const texto = `Infelizmente, não há mais escolas disponíveis para o ${nivel.filtro} no momento.`;
      setAviso({ texto, libras: `Agora não ter escola para estudar ${nivel.filtro === "Ensino Fundamental" ? "primeiro grau" : "segundo grau"}.` });
      void falarAgora(texto);
    } catch {
      const texto = "Não foi possível consultar as escolas. Por favor, tente novamente.";
      setAviso({ texto, libras: "Não conseguir buscar escola. Por favor tentar de novo." });
      void falarAgora(texto);
    } finally { consultando.current = false; }
  };

  return (
    <main data-nivel-tela className="min-h-dvh bg-fundo-claro text-texto-principal xl:flex xl:flex-col">
      <CabecalhoFluxo etapa={1} textoAudio={leituraCompleta} onVoltar={() => { interromper(); onVoltar(); }} />

      <section data-nivel-conteudo className="mx-auto flex w-full max-w-[440px] flex-col px-4 pb-6 pt-2 md:max-w-[620px] md:px-8 xl:max-w-[1200px] xl:flex-1 xl:px-10 xl:pb-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="xl:mt-2 xl:text-center">
          <div className="flex items-start gap-2 xl:items-center xl:justify-center">
            <div>
              <h1 id="pergunta-nivel" className="max-w-[21rem] text-[1.65rem] font-black leading-[1.12] tracking-tight text-texto-principal md:max-w-none md:text-4xl xl:text-[clamp(1.625rem,4vw,2.375rem)]">{pergunta}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">{instrucao}</p>
            </div>
            {ativo && <BotaoDoBloco texto={`${pergunta} ${instrucao}`} />}
          </div>
        </motion.div>

        <div data-nivel-opcoes aria-labelledby="pergunta-nivel" className="mt-5 flex flex-col gap-[clamp(0.75rem,2dvh,1.25rem)] xl:my-auto xl:grid xl:grid-cols-3 xl:gap-[30px] xl:py-6">
          {niveis.map((nivel, indice) => {
            const Icone = nivel.icone;
            const indisponivel = disponibilidade[nivel.filtro] === false;
            const pacote = pacoteDaOpcao(nivel, indice) + (indisponivel ? " Não há escolas disponíveis para este nível no momento." : "");
            return (
              <motion.article
                key={nivel.titulo}
                data-nivel-opcao
                data-nivel-indisponivel={indisponivel}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={indisponivel ? undefined : { y: -3 }}
                whileTap={indisponivel ? undefined : { scale: 0.985 }}
                transition={{ delay: 0.16 + indice * 0.12, duration: 0.48 }}
                className="relative flex min-h-[clamp(5.5rem,14dvh,8.5rem)] cursor-pointer items-center rounded-2xl border border-slate-200 bg-white py-3 pl-[70px] pr-14 text-left shadow-[0_5px_15px_rgb(2_87_160/0.05)] transition hover:border-azul-secundario hover:shadow-[0_10px_22px_rgb(2_87_160/0.11)] xl:min-h-[230px] xl:flex-col xl:items-start xl:rounded-3xl xl:p-5"
              >
                <button data-nivel-acao data-vlibras-acao={indisponivel ? "pronto" : undefined} aria-disabled={indisponivel} type="button" onClick={() => void escolher(nivel)} aria-label={`Escolher ${nivel.titulo.replace("\n", " ")}. ${nivel.subtitulo}${indisponivel ? " Indisponível. Toque para saber mais." : ""}`} className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-azul-acao xl:rounded-3xl"><span className="sr-only">Escolher {nivel.titulo.replace("\n", " ")}</span></button>
                <span className="pointer-events-none absolute left-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-azul-superficie text-azul-acao xl:static xl:size-[60px] xl:translate-y-0"><Icone className="size-[18px] xl:size-7" /></span>
                <span className="min-w-0 flex-1 xl:mt-2">
                  <strong className="block text-[clamp(0.95rem,2.2dvh,1.25rem)] font-black leading-[1.18] text-azul-principal xl:text-lg">{nivel.titulo.split("\n").map((linha) => <span key={linha} className="block whitespace-nowrap">{linha}</span>)}</strong>
                  <span className="mt-1 block text-[clamp(0.78rem,1.8dvh,0.98rem)] font-semibold leading-[1.38] text-azul-principal/70 xl:text-sm">{nivel.subtitulo}</span>
                </span>
                <ChevronRight aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-6 -translate-y-1/2 text-azul-secundario xl:bottom-4 xl:top-auto xl:translate-y-0" />
                {ativo && <span data-nivel-audio className="absolute right-12 top-2 z-20 xl:right-4 xl:top-4"><BotaoDoBloco texto={pacote} /></span>}
              </motion.article>
            );
          })}
        </div>

        <motion.footer role="note" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.55 }} className="mt-4 rounded-r-xl rounded-l-md border border-azul-foco border-l-[3px] border-l-azul-secundario bg-azul-superficie/55 p-3 shadow-none xl:mt-0 xl:min-h-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-2">
          <div className="flex items-start gap-2.5 xl:hidden"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-azul-principal"><Info className="size-4" /></span><p className="pt-0.5 text-[clamp(0.72rem,1.45dvh,0.84rem)] font-medium leading-relaxed text-slate-600"><strong className="font-black text-azul-secundario">Lembrando:</strong> todas as escolas são <strong className="text-azul-acao">gratuitas</strong> e possuem <strong className="text-azul-acao">auxílios</strong> para que você possa concluir os estudos com sucesso.</p></div>
          <div className="hidden text-azul-acao xl:flex xl:justify-center xl:gap-3"><HeartHandshake className="size-[26px]" /><Bus className="size-[26px]" /><Utensils className="size-[26px]" /><BookOpenCheck className="size-[26px]" /></div>
          <p className="hidden xl:mx-auto xl:mt-3 xl:block xl:max-w-md xl:text-center xl:text-xs xl:font-medium xl:leading-relaxed xl:text-slate-600">Todas as escolas são <strong className="text-azul-acao">gratuitas</strong> e possuem <strong className="text-azul-acao">auxílios</strong> para que você possa concluir os estudos com sucesso.</p>
        </motion.footer>
      </section>
      {aviso && (
        <div className="fixed inset-0 z-[1200] flex items-end bg-black/45 xl:items-center xl:justify-center xl:p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="aviso-nivel-titulo" aria-describedby="aviso-nivel-texto" onKeyDown={(evento) => { if (evento.key === "Escape") { interromper(); setAviso(null); } }} className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-6 xl:max-w-md xl:rounded-[28px]">
            <button ref={fecharAviso} data-vlibras-acao="pronto" type="button" aria-label="Fechar aviso" onClick={() => { interromper(); setAviso(null); }} className="float-right rounded-full bg-slate-100 p-2"><X className="size-5" /></button>
            <h2 id="aviso-nivel-titulo" className="pt-4 text-2xl font-black text-[#1e1b4b]">Aviso</h2>
            <p id="aviso-nivel-texto" data-nivel-aviso-libras={aviso.libras} className="mt-4 leading-relaxed text-slate-600">{aviso.texto}</p>
            {ativo && <div className="mt-3"><BotaoDoBloco texto={aviso.texto} /></div>}
            <button data-vlibras-acao="pronto" type="button" onClick={() => { interromper(); setAviso(null); }} className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-bold text-white">Entendi</button>
          </div>
        </div>
      )}
    </main>
  );
}

function BotaoDoBloco({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" interromperEvento className="flex size-9 shrink-0 items-center justify-center rounded-full bg-azul-superficie text-azul-acao hover:bg-azul-foco disabled:cursor-wait disabled:opacity-75" />;
}
