"use client";

import { useSyncExternalStore } from "react";

const evento = "eja-menu-acessibilidade";
let aberto = false;

export function definirMenuAcessibilidade(valor: boolean) {
  aberto = valor;
  window.dispatchEvent(new Event(evento));
}

const observar = (atualizar: () => void) => {
  window.addEventListener(evento, atualizar);
  return () => window.removeEventListener(evento, atualizar);
};

export function useMenuAcessibilidadeAberto() {
  return useSyncExternalStore(observar, () => aberto, () => false);
}
