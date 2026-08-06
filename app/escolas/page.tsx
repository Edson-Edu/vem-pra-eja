"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaEscolas from "../components/TelaEscolas";
import { type Escola, type Turno } from "../lib/escolas";
import { buscarEscolas } from "../lib/supabase-client";

export default function PaginaEscolas() { return <Suspense><Conteudo /></Suspense>; }

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const nivel = (params.get("nivel") === "Ensino Médio" ? "Ensino Médio" : "Ensino Fundamental") as Turno["nivel"];
  const [escolas, setEscolas] = useState<Escola[] | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarEscolas(nivel)
      .then((dados) => { if (ativo) setEscolas(dados); })
      .catch(() => { if (ativo) setEscolas([]); });
    return () => { ativo = false; };
  }, [nivel]);

  if (escolas === null) return <Carregando texto="Carregando escolas no mapa..." />;
  return <TelaEscolas nivel={nivel} escolas={escolas} onVoltar={() => router.back()} onDetalhes={(id) => router.push(`/detalhes?escola=${id}&nivel=${encodeURIComponent(nivel)}`)} />;
}

function Carregando({ texto }: { texto: string }) { return <main className="grid min-h-dvh place-items-center bg-[#f2f3f6]"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-[#d6e8fa] border-t-[#008bff]" /><p className="mt-4 font-bold text-[#0257a0]">{texto}</p></div></main>; }
