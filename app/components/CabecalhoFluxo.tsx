"use client";

import { ArrowLeft } from "lucide-react";
import type { Ref } from "react";
import BotaoAudio from "./BotaoAudio";
import IndicadorProgresso from "./IndicadorProgresso";

type Props = {
  etapa: 1 | 2 | 3 | 4;
  textoAudio: string;
  onVoltar?: () => void;
  posicao?: "sticky" | "absolute" | "relative";
  referencia?: Ref<HTMLHeadElement>;
  concluido?: boolean;
};

const classeDaPosicao = {
  sticky: "sticky",
  absolute: "absolute",
  relative: "relative",
};

export default function CabecalhoFluxo({ etapa, textoAudio, onVoltar, posicao = "sticky", referencia, concluido = false }: Props) {
  return (
    <header
      data-eja-cabecalho-fluxo
      ref={referencia}
      className={`${classeDaPosicao[posicao]} inset-x-0 top-0 z-[1100] h-[120px] bg-fundo-claro/95 px-4 pb-3 pt-3 text-texto-principal shadow-sm backdrop-blur-sm md:px-10`}
    >
      <div className="flex h-11 items-center justify-between">
        {onVoltar ? (
          <button
            type="button"
            data-vlibras-acao="pronto"
            aria-label="Voltar"
            onClick={onVoltar}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-azul-principal shadow-[0_2px_8px_rgb(0_0_0/0.12)] transition-transform hover:scale-105 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-azul-acao"
          >
            <ArrowLeft className="size-[22px]" aria-hidden="true" />
            <span>Voltar</span>
          </button>
        ) : <span className="size-11" aria-hidden="true" />}

        <BotaoAudio
          texto={textoAudio}
          ariaLabel="Ativar ou desativar leitura assistida"
          className="flex size-11 items-center justify-center rounded-full bg-white text-azul-secundario shadow-[0_2px_8px_rgb(0_0_0/0.12)] transition-transform hover:scale-105 disabled:cursor-wait disabled:opacity-75"
        />
      </div>

      <IndicadorProgresso etapa={etapa} concluido={concluido} className="mx-auto mt-8 max-w-[760px]" />
    </header>
  );
}
