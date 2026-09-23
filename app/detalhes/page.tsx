"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaDetalhes from "../components/TelaDetalhes";
import { type Escola } from "../lib/escolas";
import { registrarTurno, useFluxoAutorizado } from "../lib/fluxo-navegacao";
import { registrarEventoAnalytics } from "../lib/analytics";
import { buscarEscolas } from "../lib/supabase-client";

export default function PaginaDetalhes() {
  return <Suspense><Conteudo /></Suspense>;
}

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("escola");
  const nivelInformado = params.get("nivel");
  const nivel = nivelInformado === "Ensino Fundamental" || nivelInformado === "Ensino Médio"
    ? nivelInformado
    : null;
  const fluxoAutorizado = useFluxoAutorizado({ nivel, escolaId: id });
  const [escola, setEscola] = useState<Escola | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id || !nivel || !fluxoAutorizado) {
      router.replace("/");
      return;
    }

    let ativo = true;
    let escolaDaLista: Escola | null = null;

    try {
      const armazenada = sessionStorage.getItem("eja-escola-selecionada");
      const candidata = armazenada ? JSON.parse(armazenada) as Escola : null;
      if (candidata?.id === id) {
        escolaDaLista = candidata;
        setEscola(candidata);
        setCarregando(false);
      }
    } catch {
      // O detalhe continua disponível pela consulta ao banco abaixo.
    }

    setCarregando(!escolaDaLista);
    buscarEscolas(nivel, id)
      .then((dados) => {
        if (!ativo) return;
        if (dados[0]) setEscola(dados[0]);
        setCarregando(false);
      })
      .catch(() => {
        if (!ativo) return;
        // Se a rede falhar no celular, o cartão escolhido no mapa continua
        // sendo suficiente para a pessoa consultar e seguir para o cadastro.
        setEscola((atual) => atual ?? escolaDaLista);
        setCarregando(false);
      });

    return () => { ativo = false; };
  }, [fluxoAutorizado, id, nivel, router]);

  if (!id || !nivel || !fluxoAutorizado) return <Carregando />;
  if (carregando) return <Carregando />;
  if (!escola) {
    return (
      <main className="grid min-h-dvh place-items-center bg-fundo-claro p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-black text-texto-principal">Não foi possível encontrar esta escola</h1>
          <p className="mt-2 text-slate-600">Volte ao mapa e selecione a escola novamente.</p>
          <button type="button" onClick={() => router.back()} className="mt-6 rounded-xl bg-azul-acao px-5 py-3 font-bold text-white">Voltar ao mapa</button>
        </div>
      </main>
    );
  }

  return <TelaDetalhes escola={escola} nivel={nivel} onVoltar={() => router.back()} onInscrever={(turno) => { registrarTurno(turno.id); registrarEventoAnalytics("iniciou_cadastro", { nivel, escola_id: escola.id, turno: turno.turno }); router.push(`/cadastro?escola=${escola.id}&turno=${turno.id}&nivel=${encodeURIComponent(nivel)}`); }} />;
}

function Carregando() {
  return <main className="grid min-h-dvh place-items-center bg-fundo-claro"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-azul-foco border-t-azul-acao" /><p className="mt-4 font-bold text-azul-principal">Carregando informações da escola...</p></div></main>;
}
