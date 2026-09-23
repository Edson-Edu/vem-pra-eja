"use client";

import { useEffect, useState } from "react";

export const tamanhosTexto = [100, 125, 150] as const;
export type TamanhoTexto = typeof tamanhosTexto[number];
const chave = "eja-tamanho-texto";

export function normalizarTamanhoTexto(valor: unknown): TamanhoTexto {
  const numero = Number(valor);
  return numero === 125 || numero === 150 ? numero : 100;
}

export function useTamanhoTexto() {
  const [tamanho, setTamanho] = useState<TamanhoTexto>(100);
  useEffect(() => {
    const carregar = () => {
      let valor: TamanhoTexto = 100;
      try { valor = normalizarTamanhoTexto(localStorage.getItem(chave)); } catch { /* Preferência opcional. */ }
      setTamanho(valor);
      document.documentElement.dataset.ejaTexto = String(valor);
    };
    carregar();
    window.addEventListener("storage", carregar);
    return () => window.removeEventListener("storage", carregar);
  }, []);
  const escolher = (valor: TamanhoTexto) => {
    setTamanho(valor);
    document.documentElement.dataset.ejaTexto = String(valor);
    try { localStorage.setItem(chave, String(valor)); } catch { /* Funciona nesta sessão mesmo sem armazenamento. */ }
  };
  return { tamanho, escolher };
}
