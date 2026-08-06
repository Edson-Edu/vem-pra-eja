"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, FileCheck2, Home, PhoneCall } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import { useAudioDescricao } from "./useAudioDescricao";

type Props = { onInicio: () => void };

const etapas = [
  {
    numero: "1",
    icone: <ClipboardCheck className="size-4" />,
    titulo: "Análise dos dados",
    descricao: "A equipe escolar analisa seus dados para entrar em contato.",
  },
  {
    numero: "2",
    icone: <PhoneCall className="size-4" />,
    titulo: "Aguarde o contato",
    descricao: "Fique atento ao seu telefone ou e-mail para concluir a matrícula.",
  },
  {
    numero: "3",
    icone: <FileCheck2 className="size-4" />,
    titulo: "Documentação",
    descricao: "Se tudo estiver correto, basta levar os documentos solicitados para a escola.",
  },
];

export default function TelaSucesso({ onInicio }: Props) {
  const textoConfirmacao = "Pré-inscrição enviada. Próximos passos.";
  const resumo = `${textoConfirmacao} ${etapas.map((etapa) => `${etapa.numero}. ${etapa.titulo}. ${etapa.descricao}`).join(" ")}`;
  const { ativo, falarAgora, interromper } = useAudioDescricao();

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(resumo), 500);
    return () => window.clearTimeout(espera);
  }, [falarAgora, resumo]);

  return (
    <main className="sucesso-tela relative flex min-h-dvh items-center justify-center overflow-hidden bg-fundo-claro p-4 sm:p-5">
      <BotaoAudio texto={resumo} ariaLabel="Ativar ou desativar leitura assistida" className="rounded-full bg-white p-3 text-[#008bff] disabled:cursor-wait disabled:opacity-75" />
      <section className="sucesso-cartao relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white px-5 py-6 text-center shadow-xl shadow-[#0257a0]/10 sm:px-7 sm:py-7">
        <div data-vlibras-pai="sucesso-resumo" data-vlibras-texto={textoConfirmacao} className="sucesso-resumo relative">
          <ConfirmacaoAnimada />
          <div className="mt-4 flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-[#1e293b] sm:text-3xl">Pré-inscrição enviada!</h1>
            {ativo && <BotaoPai texto={textoConfirmacao} />}
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-snug text-slate-600">
            Próximos passos
          </p>
        </div>

        <div className="sucesso-etapas relative mt-5 space-y-2 text-left sm:mt-6 sm:space-y-3">
          {etapas.map((etapa) => (
            <Passo key={etapa.numero} {...etapa} ativo={ativo} falarAgora={falarAgora} />
          ))}
        </div>

        <button
          data-vlibras-acao="pronto"
          type="button"
          onClick={() => {
            interromper();
            onInicio();
          }}
          className="sucesso-voltar relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#008bff] py-3.5 font-bold text-white sm:mt-6 sm:py-4"
        >
          <Home className="size-5" />
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
      className="sucesso-selo mx-auto flex size-16 items-center justify-center rounded-full bg-[#07aa43] shadow-lg shadow-[#07aa43]/20 sm:size-20"
    >
      <motion.svg viewBox="0 0 24 24" className="size-10 text-white sm:size-12" fill="none" aria-hidden="true">
        <motion.path
          d="M5 12.5 9.5 17 19 7.5"
          stroke="currentColor"
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.45, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.div>
  );
}

function BotaoPai({ texto }: { texto: string }) {
  return (
    <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" tamanhoIcone={16} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] hover:bg-[#d6e8fa] disabled:cursor-wait disabled:opacity-75" />
  );
}

function Passo({ numero, icone, titulo, descricao, ativo, falarAgora }: {
  numero: string;
  icone: ReactNode;
  titulo: string;
  descricao: string;
  ativo: boolean;
  falarAgora: (texto: string) => Promise<void>;
}) {
  const texto = `${numero}. ${titulo}. ${descricao}`;
  return (
    <article data-vlibras-pai="sucesso-passo" data-vlibras-texto={texto} className="relative flex gap-3 rounded-2xl border border-slate-200 p-3 shadow-sm">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#008bff] text-sm font-black text-white">{numero}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[#4e8afb]">{icone}</span>
          <strong className="text-sm text-slate-800">{titulo}</strong>
          {ativo && <BotaoPai texto={texto} />}
        </div>
        <p className="mt-1 text-xs leading-snug text-slate-500">{descricao}</p>
      </div>
    </article>
  );
}
