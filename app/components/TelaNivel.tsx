"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, BookOpenCheck, BookX, Bus, GraduationCap, HeartHandshake, Info, Utensils } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
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
const pacoteDaOpcao = (nivel: Nivel, indice: number) => `Opção ${indice + 1}: ${textoParaAudio(nivel.titulo.replace("\n", ", "))}. ${nivel.subtitulo}`;
const leituraCompleta = `${pergunta} ${niveis.map(pacoteDaOpcao).join(" ")} Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir os estudos.`;

export default function TelaNivel({ onVoltar, onEscolher }: Props) {
  const { ativo, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraCompleta), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora]);

  return (
    <main className="min-h-dvh bg-fundo-claro text-texto-principal xl:flex xl:flex-col">
      <header className="sticky top-0 z-[1100] flex h-16 items-center justify-between bg-fundo-claro/95 px-4 backdrop-blur-sm md:h-20 md:px-10 xl:bg-fundo-claro xl:backdrop-blur-none">
        <button type="button" aria-label="Voltar para a abertura" onClick={() => { interromper(); onVoltar(); }} className="flex size-11 items-center justify-center rounded-full bg-white text-[#4e8afb] shadow-[0_2px_8px_rgb(0_0_0/0.08)] transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#008bff]">
          <ArrowLeft className="size-[22px]" />
        </button>
        <BotaoAudio texto={leituraCompleta} ariaLabel="Ativar ou desativar leitura assistida" className="flex size-11 items-center justify-center rounded-full bg-white text-[#4e8afb] shadow-[0_2px_8px_rgb(0_0_0/0.08)] transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-75" />
      </header>

      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[440px] flex-col px-4 pb-6 pt-1 md:max-w-[620px] md:px-8 xl:min-h-0 xl:max-w-[1200px] xl:flex-1 xl:px-10 xl:pb-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="xl:mt-2 xl:text-center">
          <span className="inline-flex rounded-full bg-[#e6f0fa] px-3 py-1 text-xs font-black text-[#4e8afb] xl:hidden">Sua trajetória escolar</span>
          <div className="mt-3 flex items-start gap-2 xl:mt-0 xl:items-center xl:justify-center">
            <h1 className="max-w-[21rem] text-[1.65rem] font-black leading-[1.12] tracking-tight text-[#1e293b] md:max-w-none md:text-4xl xl:text-[clamp(1.625rem,4vw,2.375rem)]">{pergunta}</h1>
            {ativo && <BotaoDoBloco texto={pergunta} />}
          </div>
        </motion.div>

        <div className="relative mt-5 flex flex-col gap-[clamp(1rem,3dvh,1.75rem)] xl:my-auto xl:grid xl:grid-cols-3 xl:gap-[30px] xl:py-7">
          <i aria-hidden="true" className="absolute bottom-10 left-[27px] top-10 w-0.5 bg-[#d6e8fa] xl:hidden" />
          {niveis.map((nivel, indice) => {
            const Icone = nivel.icone;
            const pacote = pacoteDaOpcao(nivel, indice);
            const escolher = () => { interromper(); onEscolher(nivel.filtro); };
            return (
              <motion.div
                key={nivel.titulo}
                role="button"
                tabIndex={0}
                aria-label={`Escolher ${nivel.titulo.replace("\n", " ")}`}
                onClick={escolher}
                onKeyDown={(evento) => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); escolher(); } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.985 }}
                transition={{ delay: 0.16 + indice * 0.12, duration: 0.48 }}
                className="relative z-10 flex min-h-[clamp(5.5rem,15dvh,9rem)] cursor-pointer items-center rounded-2xl border border-slate-200 bg-white py-3 pl-[70px] pr-4 text-left shadow-[0_5px_15px_rgb(2_87_160/0.05)] outline-none transition hover:border-[#008bff] hover:shadow-[0_10px_22px_rgb(2_87_160/0.11)] focus-visible:border-[#008bff] focus-visible:ring-4 focus-visible:ring-[#008bff]/15 xl:min-h-[240px] xl:flex-col xl:items-start xl:rounded-3xl xl:p-5"
              >
                <span className="absolute left-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] shadow-[0_0_0_4px_#f2f3f6] xl:static xl:size-[60px] xl:translate-y-0 xl:shadow-none"><Icone className="size-[18px] xl:size-7" /></span>
                <div className="min-w-0 flex-1 xl:mt-1">
                  <strong className="block text-[clamp(0.95rem,2.2dvh,1.25rem)] font-black leading-[1.18] text-[#0257a0] xl:text-lg">{nivel.titulo.split("\n").map((linha) => <span key={linha} className="block whitespace-nowrap">{linha}</span>)}</strong>
                  <span className="mt-1 block text-[clamp(0.78rem,1.8dvh,0.98rem)] font-semibold leading-[1.38] text-[#0257a0]/70 [overflow-wrap:normal] xl:text-sm">{nivel.subtitulo}</span>
                </div>
                {ativo && <div className="absolute right-2 top-2 xl:right-4 xl:top-4"><BotaoDoBloco texto={pacote} /></div>}
              </motion.div>
            );
          })}
        </div>

        <motion.footer role="note" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.55 }} className="mt-auto pt-[clamp(0.75rem,2dvh,1.1rem)] rounded-r-xl rounded-l-md border border-[#d6e8fa] border-l-[3px] border-l-[#4e8afb] bg-[#e6f0fa]/55 p-3 shadow-none xl:mt-0 xl:min-h-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-2 xl:pb-2">
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
