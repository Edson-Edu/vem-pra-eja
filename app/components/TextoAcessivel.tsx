"use client";

import BotaoAudio from "./BotaoAudio";
import { useAudioDescricao } from "./useAudioDescricao";

type Props = { texto: string; textoOcultoParaLer?: string; ocultarIcone?: boolean; className?: string; corIcone?: string };

export default function TextoAcessivel({ texto, textoOcultoParaLer, ocultarIcone = false, className, corIcone = "text-[#0257a0]" }: Props) {
  const { ativo } = useAudioDescricao();
  return <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}><span>{texto}</span>{ativo && !ocultarIcone && <BotaoAudio modo="ouvir" texto={textoOcultoParaLer ?? texto} ariaLabel={`Ouvir: ${texto}`} className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 disabled:cursor-wait disabled:opacity-75 ${corIcone}`} tamanhoIcone={16} />}</span>;
}
