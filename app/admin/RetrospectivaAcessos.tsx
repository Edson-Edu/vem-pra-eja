"use client";

import { BarChart3, MessageCircle, School, X } from "lucide-react";
import type { EstatisticasAnalytics } from "../lib/analytics-admin";

export default function RetrospectivaAcessos({ dados, periodo, aoFechar }: { dados: EstatisticasAnalytics; periodo: string; aoFechar: () => void }) {
  const escola = dados.encaminhamentos.escolas[0];
  const nivel = dados.encaminhamentos.niveis[0];
  return <div className="fixed inset-0 z-[1500] overflow-y-auto bg-gradient-to-br from-azul-principal to-azul-escuro p-8 text-white" role="dialog" aria-modal="true" aria-label="Retrospectiva de acessos"><button type="button" onClick={aoFechar} className="fixed right-8 top-8 rounded-full bg-white/15 p-3" aria-label="Fechar retrospectiva"><X /></button><div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col justify-center"><p className="font-black tracking-[.2em] text-azul-foco">RETROSPECTIVA VEMPRAEJA</p><h1 className="mt-3 text-5xl font-black">O caminho até as escolas</h1><p className="mt-3 text-lg text-white/75">{periodo}. Dados agregados, sem identificação de visitantes.</p><div className="mt-12 grid gap-5 md:grid-cols-3"><Resumo Icon={BarChart3} numero={dados.resumo.visitas} texto="visitas ao site" /><Resumo Icon={MessageCircle} numero={dados.resumo.cliquesWhatsapp} texto="cliques para abrir o WhatsApp" /><Resumo Icon={School} numero={escola?.total ?? 0} texto={escola ? `cliques para ${escola.nome}` : "cliques por escola ainda não registrados"} /></div><p className="mt-10 max-w-3xl text-2xl font-bold leading-relaxed">{nivel ? `${nivel.nome} foi o nível mais presente nos encaminhamentos deste período.` : "Os próximos encaminhamentos revelarão os níveis mais procurados."}</p><p className="mt-5 max-w-3xl text-sm leading-6 text-white/70">Um clique indica que a plataforma abriu o canal da escola. A conversa e a eventual matrícula acontecem fora do VemPraEJA e não são monitoradas.</p></div></div>;
}

function Resumo({ Icon, numero, texto }: { Icon: typeof BarChart3; numero: number; texto: string }) {
  return <div className="rounded-3xl border border-white/20 bg-white/10 p-7 backdrop-blur"><Icon className="size-8 text-azul-foco" /><strong className="mt-6 block text-5xl font-black">{numero.toLocaleString("pt-BR")}</strong><span className="mt-2 block text-white/80">{texto}</span></div>;
}
