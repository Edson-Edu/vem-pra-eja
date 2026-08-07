"use client";

import { LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { prepararAudioNoGestoUsuario, textoParaAudio, useAudioDescricao } from "./useAudioDescricao";

type BotaoAudioProps = {
  /** Texto ou pacote pai-filho que será reproduzido. */
  texto: string;
  /** `alternar` controla a leitura global; `ouvir` repete apenas este bloco. */
  modo?: "alternar" | "ouvir";
  ariaLabel: string;
  className?: string;
  tamanhoIcone?: number;
  interromperEvento?: boolean;
};

/**
 * Controle único da audiodescrição. Enquanto o Azure prepara o áudio, o ícone
 * vira um carregador e o botão fica indisponível. Ele volta a aceitar clique
 * no instante em que o áudio começa, não apenas quando a fala termina.
 */
export default function BotaoAudio({
  texto,
  modo = "alternar",
  ariaLabel,
  className,
  tamanhoIcone = 20,
  interromperEvento = false,
}: BotaoAudioProps) {
  const { ativo, carregando, alternar, falarAgora } = useAudioDescricao();
  const global = modo === "alternar";

  const aoClicar = (evento: React.MouseEvent<HTMLButtonElement>) => {
    if (interromperEvento) evento.stopPropagation();
    const textoPreparado = textoParaAudio(texto);
    if (global) {
      void alternar(textoPreparado);
      return;
    }
    void falarAgora(textoPreparado);
  };

  return (
    <button
      type="button"
      data-eja-audio-global={global ? "pronto" : undefined}
      aria-label={carregando ? "Preparando áudio" : ariaLabel}
      aria-pressed={global ? ativo : undefined}
      aria-busy={carregando}
      disabled={carregando}
      onPointerDown={() => prepararAudioNoGestoUsuario()}
      onClick={aoClicar}
      className={className}
    >
      {carregando ? (
        <LoaderCircle size={tamanhoIcone} className="animate-spin" aria-hidden="true" />
      ) : global && ativo ? (
        <VolumeX size={tamanhoIcone} aria-hidden="true" />
      ) : (
        <Volume2 size={tamanhoIcone} aria-hidden="true" />
      )}
    </button>
  );
}
