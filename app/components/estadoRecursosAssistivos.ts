"use client";

type Recurso = "audio" | "libras";
const chaves = { audio: "eja-audio-ativo", libras: "eja-vlibras-ativo" };
const eventos = { audio: "eja-acessibilidade", libras: "eja-vlibras-estado" };
let inicializado = false;
let recursoAtivo: Recurso | null = null;
let interromperAudio: (() => void) | undefined;

function persistir() {
  for (const recurso of ["audio", "libras"] as const) {
    try { sessionStorage.setItem(chaves[recurso], String(recursoAtivo === recurso)); } catch { /* Mantém a exclusividade mesmo sem armazenamento. */ }
  }
}

export function obterRecursoAtivo(): Recurso | null {
  if (typeof window === "undefined") return null;
  if (!inicializado) {
    inicializado = true;
    try {
      // Sessões antigas podiam salvar os dois ligados. Libras tem prioridade
      // na recuperação; nunca iniciamos voz automaticamente sobre o intérprete.
      recursoAtivo = sessionStorage.getItem(chaves.libras) === "true" ? "libras"
        : sessionStorage.getItem(chaves.audio) === "true" ? "audio" : null;
    } catch { /* A sessão segue com os dois desligados. */ }
    persistir();
  }
  return recursoAtivo;
}

export function registrarInterrupcaoAudio(interromper: () => void) {
  interromperAudio = interromper;
}

export function definirRecursoAtivo(recurso: Recurso, ligado: boolean) {
  if (typeof window === "undefined") return;
  const anterior = obterRecursoAtivo();
  if (ligado ? anterior === recurso : anterior !== recurso) return;

  // Desliga e avisa sincronicamente ANTES de habilitar o próximo recurso.
  // A interrupção também invalida downloads/falas que ainda estão na fila.
  recursoAtivo = null;
  persistir();
  if (anterior === "audio") interromperAudio?.();
  if (anterior) window.dispatchEvent(new CustomEvent(eventos[anterior], { detail: false }));
  if (ligado) {
    recursoAtivo = recurso;
    persistir();
    window.dispatchEvent(new CustomEvent(eventos[recurso], { detail: true }));
  }
}
