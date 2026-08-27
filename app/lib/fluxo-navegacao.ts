"use client";

import { useSyncExternalStore } from "react";

type Etapa = {
  nivel?: string | null;
  escolaId?: string | null;
  turnoId?: string | null;
};

const chaves = [
  "eja-fluxo-iniciado",
  "eja-fluxo-nivel",
  "eja-fluxo-escola",
  "eja-fluxo-turno",
  "eja-inscricao-concluida",
  "eja-escola-selecionada",
];

function ler(chave: string) {
  try {
    return sessionStorage.getItem(chave);
  } catch {
    return null;
  }
}

const observarFluxo = () => () => undefined;

export function useFluxoAutorizado({ nivel, escolaId, turnoId }: Etapa = {}) {
  return useSyncExternalStore(
    observarFluxo,
    () => {
      if (ler("eja-fluxo-iniciado") !== "true") return false;
      if (nivel && ler("eja-fluxo-nivel") !== nivel) return false;
      if (escolaId && ler("eja-fluxo-escola") !== escolaId) return false;
      if (turnoId && ler("eja-fluxo-turno") !== turnoId) return false;
      return true;
    },
    () => false,
  );
}

export function iniciarFluxo() {
  try {
    chaves.forEach((chave) => sessionStorage.removeItem(chave));
    sessionStorage.setItem("eja-fluxo-iniciado", "true");
  } catch {
    // Sem sessionStorage, a pessoa continua na abertura em vez de avançar sem contexto.
  }
}

export function registrarNivel(nivel: string) {
  try {
    sessionStorage.setItem("eja-fluxo-nivel", nivel);
  } catch {
    // A validação da próxima tela impede seguir sem o contexto salvo.
  }
}

export function registrarEscola(escolaId: string) {
  try {
    sessionStorage.setItem("eja-fluxo-escola", escolaId);
  } catch {
    // A validação da próxima tela impede seguir sem o contexto salvo.
  }
}

export function registrarTurno(turnoId: string) {
  try {
    sessionStorage.setItem("eja-fluxo-turno", turnoId);
  } catch {
    // A validação da próxima tela impede seguir sem o contexto salvo.
  }
}
