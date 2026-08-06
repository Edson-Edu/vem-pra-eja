"use client";

import { useEffect } from "react";
import { EVENTO_DE_REPRODUCAO_DO_AUDIO, obterEstadoDaReproducao } from "./useAudioDescricao";

/**
 * Mantém o feedback também nos controles legados enquanto as telas são
 * migradas para `BotaoAudio`. Todos os ícones globais compartilham o mesmo
 * bloqueio de clique, independentemente da rota em que foram renderizados.
 */
export default function GerenciadorFeedbackAudio() {
  useEffect(() => {
    const aplicar = () => {
      const { carregando } = obterEstadoDaReproducao();
      document.querySelectorAll<HTMLButtonElement>("[data-eja-audio-global]").forEach((botao) => {
        botao.toggleAttribute("data-eja-audio-carregando", carregando);
        botao.setAttribute("aria-busy", String(carregando));
        botao.disabled = carregando;
      });
    };

    const observador = new MutationObserver(aplicar);
    observador.observe(document.body, { childList: true, subtree: true });
    aplicar();
    window.addEventListener(EVENTO_DE_REPRODUCAO_DO_AUDIO, aplicar);
    return () => {
      observador.disconnect();
      window.removeEventListener(EVENTO_DE_REPRODUCAO_DO_AUDIO, aplicar);
    };
  }, []);

  return null;
}
