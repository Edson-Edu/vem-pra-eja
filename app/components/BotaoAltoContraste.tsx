"use client";

import { useEffect } from "react";

const classeAtiva = "alto-contraste";

function criarIcone() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor"/></svg>`;
}

/** Controle global de alto contraste, mantido fora da árvore React como o VLibras. */
export default function BotaoAltoContraste() {
  useEffect(() => {
    const existente = document.querySelector<HTMLButtonElement>("[data-eja-alto-contraste]");
    const botao = existente ?? document.createElement("button");
    if (!existente) {
      botao.type = "button";
      botao.dataset.ejaAltoContraste = "pronto";
      botao.className = "botao-alto-contraste";
      botao.innerHTML = criarIcone();
      document.body.appendChild(botao);
    }

    const aplicar = (ativo: boolean) => {
      document.documentElement.classList.toggle(classeAtiva, ativo);
      botao.setAttribute("aria-pressed", String(ativo));
      botao.setAttribute("aria-label", ativo ? "Desativar alto contraste" : "Ativar alto contraste");
      botao.title = ativo ? "Desativar alto contraste" : "Ativar alto contraste";
    };

    // A escolha é intencional em cada nova abertura do aplicativo.
    // Durante a navegação, o controle permanece montado e conserva o estado atual.
    aplicar(false);
    const alternar = () => {
      const proximo = !document.documentElement.classList.contains(classeAtiva);
      aplicar(proximo);
    };
    botao.addEventListener("click", alternar);

    return () => {
      botao.removeEventListener("click", alternar);
    };
  }, []);

  return null;
}
