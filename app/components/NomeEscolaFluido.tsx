"use client";

import { useLayoutEffect, useRef } from "react";
import TextoAcessivel from "./TextoAcessivel";
import { useAudioDescricao } from "./useAudioDescricao";

/** Mede o texto real, inclusive após carregar a fonte e ligar o botão de áudio. */
export default function NomeEscolaFluido({ nome, leitura }: { nome: string; leitura: string }) {
  const recipiente = useRef<HTMLSpanElement>(null);
  const { ativo } = useAudioDescricao();

  useLayoutEffect(() => {
    const elemento = recipiente.current;
    const texto = elemento?.querySelector<HTMLElement>("[data-eja-texto-acessivel]");
    if (!elemento || !texto) return;
    let cancelado = false;
    const ajustar = () => {
      if (cancelado) return;
      texto.style.removeProperty("font-size");
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      const linha = texto.parentElement!;
      const botao = linha.querySelector("button");
      const reserva = botao ? botao.getBoundingClientRect().width + parseFloat(getComputedStyle(linha).columnGap || "0") : 0;
      const disponivel = Math.max(1, elemento.clientWidth - reserva);
      let minimo = 0;
      let maximo = parseFloat(getComputedStyle(elemento).fontSize);
      for (let i = 0; i < 12; i++) {
        const tamanho = (minimo + maximo) / 2;
        texto.style.fontSize = `${tamanho}px`;
        if (texto.getBoundingClientRect().width <= disponivel) minimo = tamanho;
        else maximo = tamanho;
      }
      texto.style.fontSize = `${Math.floor(minimo * 100) / 100}px`;
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(elemento);
    window.addEventListener("resize", ajustar);
    document.fonts.addEventListener("loadingdone", ajustar);
    void document.fonts.ready.then(ajustar);
    return () => {
      cancelado = true;
      observador.disconnect();
      window.removeEventListener("resize", ajustar);
      document.fonts.removeEventListener("loadingdone", ajustar);
      texto.style.removeProperty("font-size");
    };
  }, [nome, ativo]);

  return <span ref={recipiente} className="eja-nome-escola-fluido"><TextoAcessivel texto={nome} textoOcultoParaLer={leitura} corIcone="text-[#4e8afb]" /></span>;
}
