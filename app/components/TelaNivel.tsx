"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Bus, HeartHandshake, School, Utensils } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import { textoParaAudio, useAudioDescricao } from "./useAudioDescricao";

type Nivel = {
  titulo: string;
  subtitulo: string;
  filtro: "Ensino Fundamental" | "Ensino Médio";
  icone: typeof BookOpen;
};

const niveis: Nivel[] = [
  { titulo: "Nunca estudei", subtitulo: "Não cheguei a frequentar a escola formalmente.", filtro: "Ensino Fundamental", icone: BookOpen },
  { titulo: "Ensino Fundamental\n(1º Grau)", subtitulo: "Do 1º ao 5º ano (antigo Primário) e do 6º ao 9º ano (antigo Ginásio).", filtro: "Ensino Fundamental", icone: BookOpen },
  { titulo: "Ensino Médio\n(2º Grau)", subtitulo: "Já concluí o 1º Grau (Fundamental) e quero cursar o 2º Grau (Médio).", filtro: "Ensino Médio", icone: School },
];

type Props = { onVoltar: () => void; onEscolher: (nivel: Nivel["filtro"]) => void };
const pergunta = "Até que série ou ano você estudou?";
const pacoteDaOpcao = (nivel: Nivel, indice: number) => `Opção ${indice + 1}: ${textoParaAudio(nivel.titulo.replace("\n", ", "))}. ${nivel.subtitulo}`;
const leituraCompleta = `${pergunta} ${niveis.map(pacoteDaOpcao).join(" ")} Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir os estudos.`;

export default function TelaNivel({ onVoltar, onEscolher }: Props) {
  const { ativo, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraCompleta), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora]);

  return (
    <main className="flex min-h-dvh flex-col bg-fundo-claro text-texto-principal">
      <header className="sticky top-0 z-[1100] flex h-20 shrink-0 items-center justify-between bg-fundo-claro px-6 md:px-10">
        <button type="button" aria-label="Voltar para a abertura" onClick={() => { interromper(); onVoltar(); }} className="flex size-11 items-center justify-center rounded-full bg-white text-[#4e8afb] shadow-[0_2px_8px_rgb(0_0_0/0.08)] transition-transform hover:scale-105">
          <ArrowLeft className="size-[22px]" />
        </button>
        <BotaoAudio texto={leituraCompleta} ariaLabel="Ativar ou desativar leitura assistida" className="flex size-11 items-center justify-center rounded-full bg-white text-[#4e8afb] shadow-[0_2px_8px_rgb(0_0_0/0.08)] transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-75" />
      </header>
      <section className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-6 pb-5 md:px-10">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mt-2 flex items-center justify-center gap-2">
          <h1 className="text-center text-[clamp(1.625rem,4vw,2.375rem)] font-black tracking-tight">{pergunta}</h1>
          {ativo && <BotaoDoBloco texto={pergunta} />}
        </motion.div>

        <div className="my-auto grid gap-4 py-7 xl:grid-cols-3 xl:gap-[30px]">
          {niveis.map((nivel, indice) => {
            const Icone = nivel.icone;
            const pacote = pacoteDaOpcao(nivel, indice);
            const escolher = () => { interromper(); onEscolher(nivel.filtro); };
            return (
              <motion.div key={nivel.titulo} role="button" tabIndex={0} onClick={escolher} onKeyDown={(evento) => { if (evento.key === "Enter" || evento.key === " ") escolher(); }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + indice * 0.15, duration: 0.6 }} className="flex min-h-[152px] cursor-pointer items-center gap-4 rounded-3xl border border-slate-300 bg-white p-5 text-left shadow-[0_5px_15px_rgb(2_87_160/0.04)] transition hover:border-[#008bff] xl:min-h-[240px] xl:flex-col xl:items-start">
                <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-[#4e8afb]/10 text-[#4e8afb]"><Icone className="size-7" /></span>
                <div className="flex min-w-0 flex-1 flex-col xl:mt-1">
                  <strong className="whitespace-pre-line text-lg font-black text-[#0257a0]">{nivel.titulo}</strong>
                  <span className="mt-1 text-sm font-semibold leading-snug text-[#0257a0]/70">{nivel.subtitulo}</span>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-2 xl:flex-row">
                  {ativo && <BotaoDoBloco texto={pacote} />}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.footer initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="pb-2 text-center">
          <div className="flex justify-center gap-3 text-[#4e8afb]/50"><HeartHandshake className="size-[26px]" /><Bus className="size-[26px]" /><Utensils className="size-[26px]" /></div>
          <p className="mx-auto mt-3 max-w-md text-xs font-medium leading-relaxed text-slate-500">Todas as escolas são <strong className="text-[#008bff]">gratuitas</strong> e possuem <strong className="text-[#008bff]">auxílios</strong> para concluir com sucesso.</p>
        </motion.footer>
      </section>
    </main>
  );
}

function BotaoDoBloco({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" interromperEvento className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] hover:bg-[#d6e8fa] disabled:cursor-wait disabled:opacity-75" />;
}
