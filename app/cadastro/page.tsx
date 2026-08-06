"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelaCadastro from "../components/TelaCadastro";
import { escolaPorId, escolas, type Escola, type Turno } from "../lib/escolas";
import { buscarEscolas } from "../lib/supabase-client";
export default function PaginaCadastro() { return <Suspense><Conteudo /></Suspense>; }
function Conteudo() {
  const router = useRouter(); const params = useSearchParams(); const id = params.get("escola"); const turnoId = params.get("turno");
  const nivel = (params.get("nivel") === "Ensino Médio" ? "Ensino Médio" : "Ensino Fundamental") as Turno["nivel"];
  const [escola, setEscola] = useState<Escola>(() => escolaPorId(id) ?? escolas[0]);
   useEffect(() => { if (!id) return; let ativo = true; buscarEscolas(nivel, id).then((dados) => { if (ativo && dados[0]) setEscola(dados[0]); }).catch(() => undefined); return () => { ativo = false; }; }, [id, nivel]);
  const turno = escola.turnos.find((item) => item.id === turnoId) ?? escola.turnos[0];
  if (!turno) return null;
  return <TelaCadastro escola={escola} turno={turno} onVoltar={() => router.back()} onSucesso={(nome) => router.push(`/sucesso?nome=${encodeURIComponent(nome)}&escola=${encodeURIComponent(escola.nome)}&turno=${encodeURIComponent(turno.turno)}`)} />;
}
