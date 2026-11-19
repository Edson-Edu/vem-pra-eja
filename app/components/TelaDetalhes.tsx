"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  HandHeart,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  MessageCircle,
  Moon,
  Sun,
  Sunset,
  X,
} from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import IconeAuxilio from "./IconeAuxilio";
import CabecalhoFluxo from "./CabecalhoFluxo";
import type { Escola, Turno } from "../lib/escolas";
import { distanciaEmMetros, formatarDistancia, useLocalizacaoUsuario } from "../lib/localizacao";
import NomeEscolaFluido from "./NomeEscolaFluido";
import { diasDeAulaParaAudio, textoParaAudio, useAudioDescricao } from "./useAudioDescricao";
import { formatarTelefoneBrasileiro, linkDoWhatsApp, linkDoWhatsAppContingencia, WHATSAPP_CONTINGENCIA } from "../lib/whatsapp";
import { registrarEventoAnalytics } from "../lib/analytics";

type Props = {
  escola: Escola;
  nivel: Turno["nivel"];
  onVoltar: () => void;
  onContato: (turno: Turno) => void;
};

const iconeTurno = (turno: string) =>
  /manh/i.test(turno) ? Sun : /tarde/i.test(turno) ? Sunset : /noite/i.test(turno) ? Moon : Clock3;

const descricaoAuxilio: Record<string, string> = {
  "Alimentação": "Refeição oferecida nos dias de aula.",
  Transporte: "A escola orienta sobre os critérios e a disponibilidade de transporte.",
  Uniforme: "Kit de vestuário entregue gratuitamente.",
  "Livros didáticos": "Materiais de estudo disponibilizados para acompanhar as aulas.",
  "Material escolar": "Itens básicos para as atividades escolares.",
};

// Texto exclusivo do VLibras para o CEJA. A interface continua exibindo a
// descrição completa da escola, mas o tradutor recebe "em cidade perto" em
// vez dos nomes próprios. Assim não há risco de Bombinhas virar o sinal de
// bomba ou Porto Belo ser interpretado como duas palavras comuns.
//
// Este é texto em português adaptado, não uma glosa interna. Desse modo o
// próprio VLibras resolve verbos como "escolher" e "avisar" e não expõe os
// códigos técnicos 1S_ESCOLHER_2S, 1S_AVISAR_2S ou sinais de pontuação.
const textoCejaBalnearioCamboriuParaVLibras = "Aqui você terminar Ensino Médio tempo um ano e seis meses Você escolher estudar normal ou estudar curso profissionalizante Aviso importante se você não ter diploma Ensino Fundamental escola dar prova para você começar direto Ensino Médio Escola também ter turmas em cidade perto";

export default function TelaDetalhes({ escola, nivel, onVoltar, onContato }: Props) {
  const [selecionado, setSelecionado] = useState<Turno | null>(null);
  const [auxilioAberto, setAuxilioAberto] = useState<string | null>(null);
  const { ativo, falarAgora, interromper } = useAudioDescricao();
  const { localizacao } = useLocalizacaoUsuario();
  const turnos = escola.turnos.filter((turno) => turno.nivel === nivel);
  const leituraInicial = `Etapa 3 de 3: Contato. ${textoParaAudio(escola.nome)}, no bairro ${escola.bairro}, em ${escola.cidade}. Selecione um turno para conhecer horários, dias de aula, como funciona, auxílios e falar diretamente com a escola.`;
  const textoDistancia = localizacao
    ? formatarDistancia(distanciaEmMetros(localizacao, escola))
    : "Confira no mapa";
  const usarTextoAdaptadoDoCejaBalnearioCamboriu = /\bCEJA\b.*Balneário.*Camboriú/i.test(escola.nome) && nivel === "Ensino Médio";

  const pacoteDoTurno = (turno: Turno) => {
    const dias = diasDeAulaParaAudio(turno.diasAula);
    const auxilios = turno.auxilios.join(", ") || "não informado";
    return `Turno da ${turno.turno} selecionado. As aulas acontecem das ${textoParaAudio(turno.horario.replace("-", " até "))}, ${dias}. Distância: ${textoDistancia}. Como funciona: ${turno.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."} Auxílios oferecidos: ${auxilios}.`;
  };

  const resumo = selecionado ? pacoteDoTurno(selecionado) : leituraInicial;
  const linkWhatsapp = selecionado ? linkDoWhatsApp(escola.whatsapp, escola.nome, nivel, selecionado.turno) : null;
  const linkContingencia = selecionado ? linkDoWhatsAppContingencia(escola.nome, nivel, selecionado.turno) : null;

  useEffect(() => {
    registrarEventoAnalytics("chegou_contato", { escolaId: escola.id, nivel });
  }, [escola.id, nivel]);

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraInicial), 500);
    return () => window.clearTimeout(espera);
  }, [escola.id, falarAgora, leituraInicial]);

  return (
    <main className="min-h-dvh bg-fundo-claro">
      <CabecalhoFluxo etapa={3} textoAudio={resumo} onVoltar={() => { interromper(); onVoltar(); }} />

      <section className="mx-auto max-w-3xl bg-fundo-claro px-5 pb-40 pt-5">
        <div data-vlibras-pai="resumo-escola" className="mb-6 text-center">
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            <NomeEscolaFluido nome={escola.nome} leitura={leituraInicial} />
          </h1>
          <p className="mt-2 text-sm text-slate-500">{escola.bairro} · {escola.cidade} · SC</p>
        </div>
        <p data-vlibras-pai="instrucao-turnos" className="text-sm font-bold text-azul-escuro">Selecione um turno:</p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {turnos.map((turno) => {
            const Icone = iconeTurno(turno.turno);
            const selecionadoAgora = selecionado?.id === turno.id;
            return (
              <button
                key={turno.id}
                data-vlibras-pai="turno"
                data-turno-selecionado={selecionadoAgora}
                type="button"
                onClick={() => { setSelecionado(turno); void falarAgora(pacoteDoTurno(turno)); }}
                className={`min-h-[112px] rounded-2xl border p-3 text-center transition ${selecionadoAgora ? "border-azul-acao bg-azul-acao text-white shadow-lg" : "border-borda bg-white text-azul-escuro"}`}
              >
                <span className={`mx-auto flex size-12 items-center justify-center rounded-xl ${selecionadoAgora ? "bg-white/15" : "bg-azul-superficie"}`}>
                  <Icone className={`size-6 ${selecionadoAgora ? "text-white" : "text-azul-secundario"}`} />
                </span>
                <span className="block">
                  <strong className="block text-sm">{turno.turno}</strong>
                  <small className="mt-1 block text-[11px] opacity-80">{turno.horario}</small>
                </span>
              </button>
            );
          })}
        </div>

        {!selecionado ? (
          <div data-vlibras-pai="orientacao-turnos" className="px-5 py-20 text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-azul-secundario/10 text-azul-secundario"><GraduationCap className="size-10" /></span>
            <h2 className="mt-5 text-xl font-black text-azul-escuro">Escolha o melhor horário para você</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">Cada turno tem seus próprios auxílios e informações exclusivas.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Info icon={<CalendarDays />} titulo="Dias de aula" valor={selecionado.diasAula} />
              <Info icon={<MapPin />} titulo="Distância" valor={textoDistancia} />
            </div>

            <section data-vlibras-pai="como-funciona" data-vlibras-texto-adaptado={usarTextoAdaptadoDoCejaBalnearioCamboriu ? textoCejaBalnearioCamboriuParaVLibras : undefined} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-atencao-fundo p-3 text-atencao-texto"><GraduationCap /></span>
                <h2 className="flex-1 text-xl font-black text-azul-escuro">Como funciona</h2>
                {ativo && <BotaoPai texto={`Como funciona. ${selecionado.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."}`} />}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{selecionado.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."}</p>
            </section>

            <section data-vlibras-pai="auxilios" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-atencao-fundo p-3 text-atencao-texto"><HandHeart aria-hidden="true" /></span>
                <h2 className="flex-1 text-xl font-black text-azul-escuro">Auxílios</h2>
                {ativo && <BotaoPai texto={`Auxílios oferecidos: ${selecionado.auxilios.join(", ") || "nenhum auxílio informado"}.`} />}
              </div>
              <div className="mt-3 divide-y">
                {selecionado.auxilios.map((auxilio) => (
                  <button
                    key={auxilio}
                    data-vlibras-acao="pronto"
                    type="button"
                    onClick={() => { setAuxilioAberto(auxilio); void falarAgora(`${auxilio}. ${descricaoAuxilio[auxilio] ?? "Converse com a escola para confirmar as condições deste auxílio."}`); }}
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <span className="rounded-lg bg-azul-superficie p-2 text-azul-acao"><IconeAuxilio texto={auxilio} /></span>
                    <strong className="flex-1 text-sm text-azul-escuro">{auxilio}</strong>
                    <ChevronRight className="size-5 text-azul-secundario" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      {selecionado && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-fundo-claro px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_22px_rgb(15_23_42/0.10)]">
          {linkWhatsapp ? <a data-vlibras-acao="pronto" href={linkWhatsapp} target="_blank" rel="noopener noreferrer" onClick={() => { interromper(); onContato(selecionado); }} className="mx-auto flex w-full max-w-3xl items-center justify-center gap-2 rounded-2xl bg-[#168a45] py-4 font-black text-white shadow-lg transition hover:bg-[#11753a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-azul-acao"><MessageCircle className="size-5" aria-hidden="true" />Falar com a escola pelo WhatsApp ({selecionado.turno})</a> : <div className="mx-auto max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-3 text-center"><p className="text-sm font-bold text-amber-900">Esta escola não possui WhatsApp válido cadastrado.</p><p className="mt-1 text-xs leading-5 text-amber-800">Se precisar de orientação, use o contato geral de contingência do VemPraEJA. Este não é o WhatsApp oficial da escola.</p><a data-vlibras-acao="pronto" href={linkContingencia ?? undefined} target="_blank" rel="noopener noreferrer" onClick={() => { interromper(); onContato(selecionado); }} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#168a45] px-4 py-2 text-sm font-black text-white"><MessageCircle className="size-4" />Contato geral: {formatarTelefoneBrasileiro(WHATSAPP_CONTINGENCIA)}</a></div>}
        </div>
      )}

      {auxilioAberto && (
        <div className="fixed inset-0 z-[1200] flex items-end bg-black/45 xl:items-center xl:justify-center xl:p-5">
          <div className="w-full rounded-t-[28px] bg-white p-6 xl:max-w-md xl:rounded-[28px]">
            <button data-vlibras-acao="pronto" type="button" onClick={() => setAuxilioAberto(null)} className="float-right rounded-full bg-slate-100 p-2"><X className="size-5" /></button>
            <h2 className="pt-4 text-2xl font-black text-azul-escuro">{auxilioAberto}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{descricaoAuxilio[auxilioAberto] ?? "Converse com a escola para confirmar as condições deste auxílio."}</p>
            <button data-vlibras-acao="pronto" type="button" onClick={() => setAuxilioAberto(null)} className="mt-6 w-full rounded-xl bg-azul-principal py-3 font-bold text-white transition hover:bg-azul-secundario">Entendi</button>
          </div>
        </div>
      )}
    </main>
  );
}

function BotaoPai({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-azul-superficie text-azul-acao hover:bg-azul-foco disabled:cursor-wait disabled:opacity-75" />;
}

function Info({ icon, titulo, valor }: { icon: ReactNode; titulo: string; valor: string }) {
  return <div data-vlibras-pai="informacao-turno" className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"><span className="mx-auto block w-fit text-azul-secundario">{icon}</span><small className="mt-2 block text-slate-400">{titulo}</small><strong className="block text-sm text-azul-escuro">{valor}</strong></div>;
}
