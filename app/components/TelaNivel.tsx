"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, BookOpenCheck, BookX, Bus, ChevronRight, GraduationCap, HeartHandshake, Info, Utensils } from "lucide-react";
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
const leituraCompleta = `Etapa 1 de 4. ${pergunta} ${instrucao} ${niveis.map(pacoteDaOpcao).join(" ")} Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir os estudos.`;

export default function TelaNivel({ onVoltar, onEscolher }: Props) {
  const { ativo, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraCompleta), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora]);

  const escolher = (nivel: Nivel) => {
    interromper();
    onEscolher(nivel.filtro);
  };

  return (
    <main data-nivel-tela className="min-h-dvh bg-fundo-claro text-texto-principal xl:flex xl:flex-col">
      <CabecalhoFluxo etapa={1} textoAudio={leituraCompleta} onVoltar={() => { interromper(); onVoltar(); }} />

      <section data-nivel-conteudo className="mx-auto flex w-full max-w-[440px] flex-col px-4 pb-6 pt-2 md:max-w-[620px] md:px-8 xl:max-w-[1200px] xl:flex-1 xl:px-10 xl:pb-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="xl:mt-2 xl:text-center">
          <div className="flex items-start gap-2 xl:items-center xl:justify-center">
            <div>
              <h1 id="pergunta-nivel" className="max-w-[21rem] text-[1.65rem] font-black leading-[1.12] tracking-tight text-[#1e293b] md:max-w-none md:text-4xl xl:text-[clamp(1.625rem,4vw,2.375rem)]">{pergunta}</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">{instrucao}</p>
            </div>
            {ativo && <BotaoDoBloco texto={`${pergunta} ${instrucao}`} />}
          </div>
        </motion.div>

        <div data-nivel-opcoes aria-labelledby="pergunta-nivel" className="mt-5 flex flex-col gap-[clamp(0.75rem,2dvh,1.25rem)] xl:my-auto xl:grid xl:grid-cols-3 xl:gap-[30px] xl:py-6">
          {niveis.map((nivel, indice) => {
            const Icone = nivel.icone;
            const pacote = pacoteDaOpcao(nivel, indice);
            return (
              <motion.article
                key={nivel.titulo}
                data-nivel-opcao
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                transition={{ delay: 0.16 + indice * 0.12, duration: 0.48 }}
                className="relative flex min-h-[clamp(5.5rem,14dvh,8.5rem)] cursor-pointer items-center rounded-2xl border border-slate-200 bg-white py-3 pl-[70px] pr-14 text-left shadow-[0_5px_15px_rgb(2_87_160/0.05)] transition hover:border-[#4e8afb] hover:shadow-[0_10px_22px_rgb(2_87_160/0.11)] xl:min-h-[230px] xl:flex-col xl:items-start xl:rounded-3xl xl:p-5"
              >
                <button data-nivel-acao type="button" onClick={() => escolher(nivel)} aria-label={`Escolher ${nivel.titulo.replace("\n", " ")}. ${nivel.subtitulo}`} className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#008bff] xl:rounded-3xl"><span className="sr-only">Escolher {nivel.titulo.replace("\n", " ")}</span></button>
                <span className="pointer-events-none absolute left-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] xl:static xl:size-[60px] xl:translate-y-0"><Icone className="size-[18px] xl:size-7" /></span>
                <span className="min-w-0 flex-1 xl:mt-2">
                  <strong className="block text-[clamp(0.95rem,2.2dvh,1.25rem)] font-black leading-[1.18] text-[#0257a0] xl:text-lg">{nivel.titulo.split("\n").map((linha) => <span key={linha} className="block whitespace-nowrap">{linha}</span>)}</strong>
                  <span className="mt-1 block text-[clamp(0.78rem,1.8dvh,0.98rem)] font-semibold leading-[1.38] text-[#0257a0]/70 xl:text-sm">{nivel.subtitulo}</span>
                </span>
                <ChevronRight aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-6 -translate-y-1/2 text-[#4e8afb] xl:bottom-4 xl:top-auto xl:translate-y-0" />
                {ativo && <span className="absolute right-12 top-2 z-20 xl:right-4 xl:top-4"><BotaoDoBloco texto={pacote} /></span>}
              </motion.article>
            );
          })}
        </div>

        <motion.footer role="note" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.55 }} className="mt-4 rounded-r-xl rounded-l-md border border-[#d6e8fa] border-l-[3px] border-l-[#4e8afb] bg-[#e6f0fa]/55 p-3 shadow-none xl:mt-0 xl:min-h-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-2">
          <div className="flex items-start gap-2.5 xl:hidden"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[#0257a0]"><Info className="size-4" /></span><p className="pt-0.5 text-[clamp(0.72rem,1.45dvh,0.84rem)] font-medium leading-relaxed text-slate-600"><strong className="font-black text-[#4e8afb]">Lembrando:</strong> todas as escolas são <strong className="text-[#008bff]">gratuitas</strong> e possuem <strong className="text-[#008bff]">auxílios</strong> para que você possa concluir os estudos com sucesso.</p></div>
          <div className="hidden text-[#008bff] xl:flex xl:justify-center xl:gap-3"><HeartHandshake className="size-[26px]" /><Bus className="size-[26px]" /><Utensils className="size-[26px]" /><BookOpenCheck className="size-[26px]" /></div>
          <p className="hidden xl:mx-auto xl:mt-3 xl:block xl:max-w-md xl:text-center xl:text-xs xl:font-medium xl:leading-relaxed xl:text-slate-600">Todas as escolas são <strong className="text-[#008bff]">gratuitas</strong> e possuem <strong className="text-[#008bff]">auxílios</strong> para que você possa concluir os estudos com sucesso.</p>
        </motion.footer>
      </section>
    </main>
  );
}

function BotaoDoBloco({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" interromperEvento className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] hover:bg-[#d6e8fa] disabled:cursor-wait disabled:opacity-75" />;
}
