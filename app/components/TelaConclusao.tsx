"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Home, Info, School } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import CabecalhoFluxo from "./CabecalhoFluxo";
import IconeWhatsApp from "./IconeWhatsApp";
import { useAudioDescricao } from "./useAudioDescricao";

type Props = {
  escola: string;
  linkWhatsApp: string;
  onInicio: () => void;
  onReabrirWhatsApp: () => void;
};

export default function TelaConclusao({ escola, linkWhatsApp, onInicio, onReabrirWhatsApp }: Props) {
  const titulo = "Agora é só conversar com a escola!";
  const descricao = "O WhatsApp foi aberto para você entrar em contato com a escola selecionada. Envie a mensagem preparada para solicitar informações sobre a EJA.";
  const observacao = "O contato pelo WhatsApp não garante a matrícula. A escola fornecerá as orientações necessárias.";
  const resumo = `Etapa de contato concluída. ${titulo} Escola selecionada: ${escola}. ${descricao} ${observacao} Você pode abrir o WhatsApp novamente ou voltar ao início.`;
  const { ativo, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(resumo), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora, resumo]);

  return (
    <main className="sucesso-tela relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-fundo-claro p-4 pt-[136px] sm:p-5 sm:pt-[136px]">
      <CabecalhoFluxo etapa={3} textoAudio={resumo} posicao="absolute" />
      <section className="sucesso-cartao relative mx-auto w-full max-w-xl overflow-visible rounded-3xl bg-white px-5 py-6 text-center shadow-xl shadow-azul-principal/10 sm:px-7 sm:py-7">
        <div data-vlibras-pai="sucesso-resumo" data-vlibras-texto={`${titulo} ${descricao}`} className="sucesso-resumo relative">
          <ConfirmacaoAnimada />
          <div className="mt-4 flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-texto-principal sm:text-3xl">{titulo}</h1>
            {ativo && <BotaoPai texto={`${titulo} ${descricao}`} />}
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">{descricao}</p>
        </div>

        <div className="sucesso-etapas relative mt-5 space-y-2 text-left sm:mt-6 sm:space-y-3">
          <Informacao icone={<School className="size-4" />} titulo="Escola selecionada" descricao={escola} ativo={ativo} />
          <Informacao icone={<Info className="size-4" />} titulo="Importante" descricao={observacao} ativo={ativo} />
        </div>

        <a
          data-vlibras-acao="pronto"
          href={linkWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            interromper();
            onReabrirWhatsApp();
          }}
          className="relative mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#168a45] px-3 py-3.5 font-black text-white shadow-lg transition hover:bg-[#11753a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-azul-acao sm:mt-6 sm:py-4"
        >
          <IconeWhatsApp className="size-5 shrink-0" />
          Abrir WhatsApp novamente
        </a>
        <button
          data-vlibras-acao="pronto"
          type="button"
          onClick={() => {
            interromper();
            onInicio();
          }}
          className="sucesso-voltar relative mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-azul-acao py-3.5 font-bold text-azul-principal sm:py-4"
        >
          <Home className="size-5" aria-hidden="true" />
          Voltar ao início
        </button>
      </section>
    </main>
  );
}

function ConfirmacaoAnimada() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "backOut" }}
      className="sucesso-selo mx-auto flex size-16 items-center justify-center rounded-full bg-[#168a45] text-white shadow-lg shadow-[#168a45]/20 sm:size-20"
    >
      <motion.div className="sucesso-icone-whatsapp" initial={{ rotate: -12 }} animate={{ rotate: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
        <IconeWhatsApp className="size-9 sm:size-11" />
      </motion.div>
    </motion.div>
  );
}

function BotaoPai({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" tamanhoIcone={16} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul-superficie text-azul-acao hover:bg-azul-foco disabled:cursor-wait disabled:opacity-75" />;
}

function Informacao({ icone, titulo, descricao, ativo }: { icone: ReactNode; titulo: string; descricao: string; ativo: boolean }) {
  const texto = `${titulo}. ${descricao}`;
  return (
    <article data-vlibras-pai="sucesso-passo" data-vlibras-texto={texto} className="relative flex gap-3 rounded-2xl border border-slate-200 p-3 shadow-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-azul-acao text-white">{icone}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <strong className="text-sm text-slate-800">{titulo}</strong>
          {ativo && <BotaoPai texto={texto} />}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{descricao}</p>
      </div>
    </article>
  );
}
