"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaCadastro from "../components/TelaCadastro";
import { escolaPorId, type Escola } from "../lib/escolas";
import { useFluxoAutorizado } from "../lib/fluxo-navegacao";
import { buscarEscolas } from "../lib/supabase-client";
import { registrarEventoAnalytics } from "../lib/analytics";
export default function PaginaCadastro() { return <Suspense><Conteudo /></Suspense>; }
function Conteudo() {
  const router = useRouter(); const params = useSearchParams(); const id = params.get("escola"); const turnoId = params.get("turno");
  const nivelInformado = params.get("nivel");
  const nivel = nivelInformado === "Ensino Fundamental" || nivelInformado === "Ensino Médio"
    ? nivelInformado
    : null;
  const fluxoAutorizado = useFluxoAutorizado({ nivel, escolaId: id, turnoId });
  const [escola, setEscola] = useState<Escola | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id || !turnoId || !nivel || !fluxoAutorizado) {
      router.replace("/");
      return;
    }

    let ativo = true;
    const reserva = escolaPorId(id) ?? null;
    buscarEscolas(nivel, id)
      .then((dados) => dados[0] ?? reserva)
      .catch(() => reserva)
      .then((escolaEncontrada) => {
        if (!ativo) return;
        if (!escolaEncontrada || !escolaEncontrada.turnos.some((turno) => turno.id === turnoId)) {
          router.replace("/");
          return;
        }
        setEscola(escolaEncontrada);
        setCarregando(false);
      });

    return () => { ativo = false; };
  }, [fluxoAutorizado, id, nivel, router, turnoId]);

  const turno = escola?.turnos.find((item) => item.id === turnoId);
  if (!id || !turnoId || !nivel || !fluxoAutorizado || carregando || !escola || !turno) return <main className="grid min-h-dvh place-items-center bg-[#f2f3f6]"><p className="font-bold text-[#0257a0]">Voltando ao início...</p></main>;
  return <TelaCadastro escola={escola} turno={turno} onVoltar={() => router.back()} onSucesso={(nome) => { registrarEventoAnalytics("concluiu_inscricao", { nivel, escola_id: escola.id, turno: turno.turno }); sessionStorage.setItem("eja-inscricao-concluida", "true"); router.push(`/sucesso?nome=${encodeURIComponent(nome)}&escola=${encodeURIComponent(escola.nome)}&turno=${encodeURIComponent(turno.turno)}`); }} />;
}
