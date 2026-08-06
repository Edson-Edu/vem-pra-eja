"use client";

/**
 * Estado único do intérprete para toda a sessão de navegação. O componente do
 * VLibras fica no layout raiz, mas o próprio script oficial recria partes do
 * DOM ao mudar de rota; por isso a fonte de verdade não pode ser uma classe do
 * widget nem um estado local de uma tela.
 */
const CHAVE_DE_PERSISTENCIA = "eja-vlibras-ativo";
const EVENTO_DE_ESTADO = "eja-vlibras-estado";

let vlibrasAtivo = false;

export function obterEstadoVLibras() {
  if (typeof window === "undefined") return vlibrasAtivo;

  try {
    const salvo = sessionStorage.getItem(CHAVE_DE_PERSISTENCIA);
    if (salvo !== null) vlibrasAtivo = salvo === "true";
  } catch {
    // Em navegação privada ou WebViews sem storage, o estado em memória segue
    // garantindo consistência durante toda a navegação atual.
  }

  return vlibrasAtivo;
}

export function definirEstadoVLibras(ativo: boolean) {
  vlibrasAtivo = ativo;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CHAVE_DE_PERSISTENCIA, ativo ? "true" : "false");
  } catch {
    // O estado em memória continua como alternativa ao sessionStorage.
  }

  window.dispatchEvent(new CustomEvent<boolean>(EVENTO_DE_ESTADO, { detail: ativo }));
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
