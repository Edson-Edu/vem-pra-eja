"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaConclusao from "../components/TelaConclusao";
import type { Escola, Turno } from "../lib/escolas";
import { registrarEventoAnalytics } from "../lib/analytics";
import { iniciarFluxo, useFluxoAutorizado } from "../lib/fluxo-navegacao";
import { buscarEscolas } from "../lib/supabase-client";
import { linkDoWhatsApp, linkDoWhatsAppContingencia } from "../lib/whatsapp";

export default function PaginaConclusao() {
  return <Suspense><Conteudo /></Suspense>;
}

function Conteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const escolaId = params.get("escola");
  const turnoId = params.get("turno");
  const nivelInformado = params.get("nivel");
  const nivel = nivelInformado === "Ensino Fundamental" || nivelInformado === "Ensino Médio" ? nivelInformado : null;
  const fluxoAutorizado = useFluxoAutorizado({ nivel, escolaId, turnoId });
  const [escola, setEscola] = useState<Escola | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!escolaId || !turnoId || !nivel || !fluxoAutorizado) {
      router.replace("/");
      return;
    }

    let ativo = true;
    buscarEscolas(nivel, escolaId)
      .then((dados) => {
        if (!ativo) return;
        const encontrada = dados[0] ?? null;
        const turnoEncontrado = encontrada?.turnos.find((item) => item.id === turnoId && item.nivel === nivel) ?? null;
        setEscola(encontrada);
        setTurno(turnoEncontrado);
        setCarregando(false);
      })
      .catch(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [escolaId, fluxoAutorizado, nivel, router, turnoId]);

  if (!escolaId || !turnoId || !nivel || !fluxoAutorizado || carregando) return <Carregando />;
  if (!escola || !turno) return <Indisponivel onInicio={() => { iniciarFluxo(); router.replace("/"); }} />;

  const linkWhatsApp = linkDoWhatsApp(escola.whatsapp, escola.nome, nivel, turno.turno)
    ?? linkDoWhatsAppContingencia(escola.nome, nivel, turno.turno);

  return (
    <TelaConclusao
      escola={escola.nome}
      linkWhatsApp={linkWhatsApp}
      onInicio={() => { iniciarFluxo(); router.replace("/"); }}
      onReabrirWhatsApp={() => registrarEventoAnalytics("clicou_whatsapp", { nivel, escolaId: escola.id, turno: turno.turno }, true)}
    />
  );
}

function Carregando() {
  return <main className="grid min-h-dvh place-items-center bg-fundo-claro"><p className="font-bold text-azul-principal">Preparando a conclusão...</p></main>;
}

function Indisponivel({ onInicio }: { onInicio: () => void }) {
  return <main className="grid min-h-dvh place-items-center bg-fundo-claro p-6"><div className="max-w-sm text-center"><h1 className="text-xl font-black text-texto-principal">Não foi possível recuperar o contato</h1><p className="mt-2 text-slate-600">Volte ao início e selecione a escola novamente.</p><button type="button" onClick={onInicio} className="mt-6 rounded-xl bg-azul-acao px-5 py-3 font-bold text-white">Voltar ao início</button></div></main>;
}
