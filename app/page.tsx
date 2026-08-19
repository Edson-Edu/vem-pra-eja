"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import TelaAbertura from "./components/TelaAbertura";
import { iniciarFluxo } from "./lib/fluxo-navegacao";

export default function Home() {
  const router = useRouter();
  const abrirTelaNivel = useCallback(() => {
    iniciarFluxo();
    router.push("/nivel");
  }, [router]);

  return <TelaAbertura onComplete={abrirTelaNivel} />;
}
