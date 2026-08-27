"use client";

import { definirRecursoAtivo, obterRecursoAtivo } from "./estadoRecursosAssistivos";

/**
 * Estado único do intérprete para toda a sessão de navegação. O componente do
 * VLibras fica no layout raiz, mas o próprio script oficial recria partes do
 * DOM ao mudar de rota; por isso a fonte de verdade não pode ser uma classe do
 * widget nem um estado local de uma tela.
 */
const EVENTO_DE_ESTADO = "eja-vlibras-estado";

export function obterEstadoVLibras() {
  return obterRecursoAtivo() === "libras";
}

export function definirEstadoVLibras(ativo: boolean) {
  definirRecursoAtivo("libras", ativo);
}

export function observarEstadoVLibras(aoMudar: (ativo: boolean) => void) {
  if (typeof window === "undefined") return () => undefined;

  const ouvir = (evento: Event) => {
    const detalhe = evento as CustomEvent<boolean>;
    aoMudar(typeof detalhe.detail === "boolean" ? detalhe.detail : obterEstadoVLibras());
  };

  window.addEventListener(EVENTO_DE_ESTADO, ouvir);
  return () => window.removeEventListener(EVENTO_DE_ESTADO, ouvir);
}
