"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import TelaSucesso from "../components/TelaSucesso";

const semInscricaoConcluida = () => false;
const observarInscricaoConcluida = () => () => undefined;

function lerInscricaoConcluida() {
  return sessionStorage.getItem("eja-inscricao-concluida") === "true";
}

export default function PaginaSucesso() {
  const router = useRouter();
  const inscricaoConcluida = useSyncExternalStore(
    observarInscricaoConcluida,
    lerInscricaoConcluida,
    semInscricaoConcluida,
  );

  useEffect(() => {
    if (!inscricaoConcluida) router.replace("/");
  }, [inscricaoConcluida, router]);

  if (!inscricaoConcluida) {
    return <main className="grid min-h-dvh place-items-center bg-[#f2f3f6]"><p className="font-bold text-[#0257a0]">Voltando ao início...</p></main>;
  }

  return <TelaSucesso onInicio={() => { sessionStorage.removeItem("eja-inscricao-concluida"); router.replace("/"); }} />;
}
