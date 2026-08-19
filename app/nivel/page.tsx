"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TelaNivel from "../components/TelaNivel";
import { registrarEventoAnalytics } from "../lib/analytics";
import { registrarNivel, useFluxoAutorizado } from "../lib/fluxo-navegacao";

export default function PaginaNivel() {
  const router = useRouter();
  const fluxoIniciado = useFluxoAutorizado();

  useEffect(() => {
    if (!fluxoIniciado) {
      router.replace("/");
    }
  }, [fluxoIniciado, router]);

  if (!fluxoIniciado) {
    return <main className="grid min-h-dvh place-items-center bg-[#f2f3f6]"><p className="font-bold text-[#0257a0]">Voltando ao início...</p></main>;
  }

  return (
    <TelaNivel
      onVoltar={() => router.replace("/")}
      onEscolher={(nivel) => {
        registrarNivel(nivel);
        registrarEventoAnalytics("escolheu_nivel", { nivel });
        router.push(`/escolas?nivel=${encodeURIComponent(nivel)}`);
      }}
    />
  );
}
