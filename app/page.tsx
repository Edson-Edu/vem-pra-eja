"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import TelaAbertura from "./components/TelaAbertura";

export default function Home() {
  const router = useRouter();
  const abrirTelaNivel = useCallback(() => router.push("/nivel"), [router]);

  return <TelaAbertura onComplete={abrirTelaNivel} />;
}
