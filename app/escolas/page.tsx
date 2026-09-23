"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaEscolas from "../components/TelaEscolas";
import { type Escola } from "../lib/escolas";
import { registrarEscola, useFluxoAutorizado } from "../lib/fluxo-navegacao";
import { registrarEventoAnalytics } from "../lib/analytics";
import { buscarEscolas } from "../lib/supabase-client";

export default function PaginaEscolas() { return <Suspense><Conteudo /></Suspense>; }

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const nivelInformado = params.get("nivel");
  const nivel = nivelInformado === "Ensino Fundamental" || nivelInformado === "Ensino Médio"
    ? nivelInformado
    : null;
  const fluxoAutorizado = useFluxoAutorizado({ nivel });
  const [escolas, setEscolas] = useState<Escola[] | null>(null);

  useEffect(() => {
    if (!nivel || !fluxoAutorizado) {
      router.replace("/");
      return;
    }

    let ativo = true;
    buscarEscolas(nivel)
      .then((dados) => { if (ativo) setEscolas(dados); })
      .catch(() => { if (ativo) setEscolas([]); });
    return () => { ativo = false; };
  }, [fluxoAutorizado, nivel, router]);

  if (!nivel || !fluxoAutorizado) return <Carregando texto="Voltando ao início..." />;
  if (escolas === null) return <Carregando texto="Carregando escolas no mapa..." />;
  return <TelaEscolas nivel={nivel} escolas={escolas} onVoltar={() => router.back()} onDetalhes={(id) => { registrarEscola(id); registrarEventoAnalytics("abriu_escola", { nivel, escola_id: id }); router.push(`/detalhes?escola=${id}&nivel=${encodeURIComponent(nivel)}`); }} />;
}

function Carregando({ texto }: { texto: string }) { return <main className="grid min-h-dvh place-items-center bg-fundo-claro"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-azul-foco border-t-azul-acao" /><p className="mt-4 font-bold text-azul-principal">{texto}</p></div></main>; }
