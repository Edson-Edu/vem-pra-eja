"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bus,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  Moon,
  Sun,
  Sunset,
  Utensils,
  X,
} from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import type { Escola, Turno } from "../lib/escolas";
import { distanciaEmMetros, formatarDistancia, useLocalizacaoUsuario } from "../lib/localizacao";
import TextoAcessivel from "./TextoAcessivel";
import { textoParaAudio, useAudioDescricao } from "./useAudioDescricao";

type Props = {
  escola: Escola;
  nivel: Turno["nivel"];
  onVoltar: () => void;
  onInscrever: (turno: Turno) => void;
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

export default function TelaDetalhes({ escola, nivel, onVoltar, onInscrever }: Props) {
  const [selecionado, setSelecionado] = useState<Turno | null>(null);
  const [auxilioAberto, setAuxilioAberto] = useState<string | null>(null);
  const { ativo, falarAgora, interromper } = useAudioDescricao();
  const { localizacao } = useLocalizacaoUsuario();
  const turnos = escola.turnos.filter((turno) => turno.nivel === nivel);
  const leituraInicial = `${textoParaAudio(escola.nome)}, no bairro ${escola.bairro}, em ${escola.cidade}. Selecione um turno para conhecer horários, dias de aula, como funciona e auxílios.`;
  const textoDistancia = localizacao
    ? formatarDistancia(distanciaEmMetros(localizacao, escola))
    : "Confira no mapa";
  const usarTextoAdaptadoDoCejaBalnearioCamboriu = /\bCEJA\b.*Balneário.*Camboriú/i.test(escola.nome) && nivel === "Ensino Médio";

  const pacoteDoTurno = (turno: Turno) => {
    const dias = textoParaAudio(turno.diasAula);
    const auxilios = turno.auxilios.join(", ") || "não informado";
    return `Turno da ${turno.turno} selecionado. As aulas acontecem das ${textoParaAudio(turno.horario.replace("-", " até "))}, ${dias}. Distância: ${textoDistancia}. Como funciona: ${turno.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."} Auxílios oferecidos: ${auxilios}.`;
  };

  const resumo = selecionado ? pacoteDoTurno(selecionado) : leituraInicial;

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(leituraInicial), 500);
    return () => window.clearTimeout(espera);
  }, [escola.id, falarAgora, leituraInicial]);

  return (
    <main className="min-h-dvh bg-[#f2f3f6]">
      <header className="sticky top-0 z-[1100] bg-[#0257a0] pb-7 pt-5 text-white">
        <div className="flex items-center justify-between px-5 md:px-10">
          <button type="button" onClick={() => { interromper(); onVoltar(); }} aria-label="Voltar" className="rounded-full bg-white/15 p-3">
            <ArrowLeft className="size-5" />
          </button>
          <BotaoAudio texto={resumo} ariaLabel="Ativar ou desativar leitura assistida" className="rounded-full bg-white p-3 text-[#0257a0] disabled:cursor-wait disabled:opacity-75" />
        </div>

        <div data-vlibras-pai="resumo-escola" className="mx-auto mt-4 max-w-3xl px-6 text-center">
          <h1 className="text-2xl font-black leading-tight sm:text-3xl">
            <TextoAcessivel texto={escola.nome} textoOcultoParaLer={leituraInicial} corIcone="text-white" />
          </h1>
          <p className="mt-2 text-sm text-white/80">{escola.bairro} · {escola.cidade} · SC</p>
        </div>
      </header>

      <section className="mx-auto -mt-3 max-w-3xl rounded-t-[34px] bg-[#f2f3f6] px-5 pb-40 pt-3">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-300" />
        <p data-vlibras-pai="instrucao-turnos" className="text-sm font-bold text-[#1e1b4b]">Selecione um turno:</p>

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
                className={`min-h-[112px] rounded-2xl border p-3 text-center transition ${selecionadoAgora ? "border-[#008bff] bg-[#008bff] text-white shadow-lg" : "border-[#e5ddff] bg-white text-[#1e1b4b]"}`}
              >
                <span className={`mx-auto flex size-12 items-center justify-center rounded-xl ${selecionadoAgora ? "bg-white/15" : "bg-[#e6f0fa]"}`}>
                  <Icone className={`size-6 ${selecionadoAgora ? "text-white" : "text-[#4e8afb]"}`} />
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
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#4e8afb]/10 text-[#4e8afb]"><GraduationCap className="size-10" /></span>
            <h2 className="mt-5 text-xl font-black text-[#1e1b4b]">Escolha o melhor horário para você</h2>
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
                <span className="rounded-xl bg-amber-100 p-3 text-amber-600"><GraduationCap /></span>
                <h2 className="flex-1 text-xl font-black text-[#1e1b4b]">Como funciona</h2>
                {ativo && <BotaoPai texto={`Como funciona. ${selecionado.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."}`} />}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{selecionado.descricao || "Você terá aulas presenciais e acompanhamento para concluir seus estudos."}</p>
            </section>

            <section data-vlibras-pai="auxilios" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-100 p-3 text-amber-600"><Bus /></span>
                <h2 className="flex-1 text-xl font-black text-[#1e1b4b]">Auxílios</h2>
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
                    <span className="rounded-lg bg-[#e6f0fa] p-2 text-[#008bff]">{auxilio === "Alimentação" ? <Utensils className="size-5" /> : <Bus className="size-5" />}</span>
                    <strong className="flex-1 text-sm text-[#1e1b4b]">{auxilio}</strong>
                    <ChevronRight className="size-5 text-violet-400" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      {selecionado && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-[#f2f3f6] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_22px_rgb(15_23_42/0.10)]">
          <button data-vlibras-acao="pronto" type="button" onClick={() => { interromper(); onInscrever(selecionado); }} className="mx-auto block w-full max-w-3xl rounded-2xl bg-[#008bff] py-4 font-black text-white shadow-lg">
            Quero me inscrever ({selecionado.turno})
          </button>
        </div>
      )}

      {auxilioAberto && (
        <div className="fixed inset-0 z-[1200] flex items-end bg-black/45 xl:items-center xl:justify-center xl:p-5">
          <div className="w-full rounded-t-[28px] bg-white p-6 xl:max-w-md xl:rounded-[28px]">
            <button data-vlibras-acao="pronto" type="button" onClick={() => setAuxilioAberto(null)} className="float-right rounded-full bg-slate-100 p-2"><X className="size-5" /></button>
            <h2 className="pt-4 text-2xl font-black text-[#1e1b4b]">{auxilioAberto}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{descricaoAuxilio[auxilioAberto] ?? "Converse com a escola para confirmar as condições deste auxílio."}</p>
            <button data-vlibras-acao="pronto" type="button" onClick={() => setAuxilioAberto(null)} className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-bold text-white">Entendi</button>
          </div>
        </div>
      )}
    </main>
  );
}

function BotaoPai({ texto }: { texto: string }) {
  return <BotaoAudio modo="ouvir" texto={texto} ariaLabel="Ouvir este bloco" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] hover:bg-[#d6e8fa] disabled:cursor-wait disabled:opacity-75" />;
}

function Info({ icon, titulo, valor }: { icon: ReactNode; titulo: string; valor: string }) {
  return <div data-vlibras-pai="informacao-turno" className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"><span className="mx-auto block w-fit text-[#4e8afb]">{icon}</span><small className="mt-2 block text-slate-400">{titulo}</small><strong className="block text-sm text-[#1e1b4b]">{valor}</strong></div>;
}
