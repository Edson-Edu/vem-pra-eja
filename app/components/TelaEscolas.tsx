"use client";

/* eslint-disable @next/next/no-img-element */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
} from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import MapaEscolas from "./MapaEscolas";
import { textoParaAudio, useAudioDescricao } from "./useAudioDescricao";
import type { Escola, Turno } from "../lib/escolas";
import { distanciaEmMetros, useLocalizacaoUsuario } from "../lib/localizacao";

type Props = {
  nivel: Turno["nivel"];
  escolas: Escola[];
  onVoltar: () => void;
  onDetalhes: (id: string) => void;
};

type ArrasteDaLista = {
  inicioY: number;
  alturaInicial: number;
};

export default function TelaEscolas({ nivel, escolas, onVoltar, onDetalhes }: Props) {
  const [selecionada, setSelecionada] = useState(escolas[0]?.id);
  const [focoNoMapa, setFocoNoMapa] = useState(0);
  const [reenquadrarMapa, setReenquadrarMapa] = useState(0);
  const [mapaAlterado, setMapaAlterado] = useState(false);
  const [alturaDaLista, setAlturaDaLista] = useState<number | null>(null);
  const referencias = useRef<Record<string, HTMLDivElement | null>>({});
  const cabecalhoRef = useRef<HTMLElement>(null);
  const listaRef = useRef<HTMLElement>(null);
  const arrasteDaListaRef = useRef<ArrasteDaLista | null>(null);
  const primeiraEscolaOrdenadaRef = useRef<string | undefined>(undefined);
  const { ativo, falarAgora, interromper } = useAudioDescricao();
  const { localizacao } = useLocalizacaoUsuario();

  const escolasOrdenadas = useMemo(() => {
    if (!localizacao) return escolas;
    return [...escolas].sort(
      (a, b) => distanciaEmMetros(localizacao, a) - distanciaEmMetros(localizacao, b),
    );
  }, [escolas, localizacao]);

  const idSelecionado = escolasOrdenadas.some((escola) => escola.id === selecionada)
    ? selecionada
    : escolasOrdenadas[0]?.id;

  const selecionar = useCallback((id: string, rolar = false) => {
    setSelecionada(id);
    setFocoNoMapa((atual) => atual + 1);
    if (rolar) {
      referencias.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const orientacao = `Encontramos ${escolas.length} escolas prontas para você. Navegue pelo mapa ou toque no nome de uma escola para ouvir seus detalhes.`;

  const comecarArrasteLista = (evento: ReactPointerEvent<HTMLButtonElement>) => {
    if (window.innerWidth >= 1280 || !listaRef.current) return;
    const alturaAtual = listaRef.current.getBoundingClientRect().height;
    if (alturaAtual < 1) return;
    arrasteDaListaRef.current = {
      inicioY: evento.clientY,
      alturaInicial: alturaAtual,
    };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  };

  const moverArrasteLista = (evento: ReactPointerEvent<HTMLButtonElement>) => {
    const arraste = arrasteDaListaRef.current;
    if (!arraste) return;
    const alturaMinima = 260;
    const alturaMaxima = Math.round(window.innerHeight * 0.82);
    const proximaAltura = arraste.alturaInicial + arraste.inicioY - evento.clientY;
    setAlturaDaLista(Math.max(alturaMinima, Math.min(alturaMaxima, proximaAltura)));
  };

  const encerrarArrasteLista = () => {
    arrasteDaListaRef.current = null;
  };

  useEffect(() => {
    const limparAlturaNoDesktop = () => {
      if (window.innerWidth >= 1280) setAlturaDaLista(null);
    };
    window.addEventListener("resize", limparAlturaNoDesktop);
    return () => window.removeEventListener("resize", limparAlturaNoDesktop);
  }, []);

  useEffect(() => {
    const maisProxima = escolasOrdenadas[0]?.id;
    if (!localizacao || !maisProxima || primeiraEscolaOrdenadaRef.current === maisProxima) return;
    primeiraEscolaOrdenadaRef.current = maisProxima;
    setSelecionada(maisProxima);
  }, [escolasOrdenadas, localizacao]);

  useEffect(() => {
    const espera = window.setTimeout(() => void falarAgora(orientacao), 500);
    return () => window.clearTimeout(espera);
  }, [escolas.length, falarAgora, orientacao]);

  const redefinirEnquadramento = () => {
    setMapaAlterado(false);
    setReenquadrarMapa((atual) => atual + 1);
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-[#dbeafe]">
      <MapaEscolas
        escolas={escolasOrdenadas}
        selecionada={idSelecionado}
        onMarcadorClick={(id) => selecionar(id, true)}
        cabecalhoRef={cabecalhoRef}
        listaRef={listaRef}
        localizacaoUsuario={localizacao}
        focoNoMapa={focoNoMapa}
        reenquadrar={reenquadrarMapa}
        onVisaoAlterada={setMapaAlterado}
      />

      {mapaAlterado && (
        <button
          type="button"
          onClick={redefinirEnquadramento}
          aria-label="Mostrar todas as escolas no mapa"
          title="Mostrar todas as escolas"
          className="absolute left-4 top-[108px] z-[1090] flex size-11 items-center justify-center rounded-full bg-white text-[#0257a0] shadow-lg transition hover:scale-105 xl:top-24"
        >
          <LocateFixed className="size-5" />
        </button>
      )}

      <header
        ref={cabecalhoRef}
        className="absolute inset-x-0 top-0 z-[1100] flex h-[74px] items-center justify-between bg-white px-5 shadow-sm"
      >
        <button
          type="button"
          onClick={() => {
            interromper();
            onVoltar();
          }}
          aria-label="Voltar"
          className="rounded-full bg-slate-100 p-3 text-[#4e8afb]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-black text-[#1e293b]">Escolha sua escola</h1>
        <BotaoAudio texto={orientacao} ariaLabel="Ativar ou desativar leitura assistida" className="rounded-full bg-slate-100 p-3 text-[#4e8afb] disabled:cursor-wait disabled:opacity-75" />
      </header>

      <section
        ref={listaRef}
        style={alturaDaLista ? { height: `${alturaDaLista}px` } : undefined}
        className="absolute inset-x-0 bottom-0 z-[1100] flex h-[61dvh] min-h-[260px] max-h-[82dvh] flex-col overflow-hidden rounded-t-[30px] bg-[#f2f3f6] shadow-[0_-8px_22px_rgb(0_0_0/0.14)] xl:bottom-8 xl:left-auto xl:right-8 xl:top-24 xl:h-auto xl:max-h-none xl:w-[440px] xl:rounded-3xl"
      >
        <div className="shrink-0 border-b border-slate-200 bg-[#f2f3f6] shadow-[0_2px_8px_rgb(15_23_42/0.04)]">
          <button
            type="button"
            onPointerDown={comecarArrasteLista}
            onPointerMove={moverArrasteLista}
            onPointerUp={encerrarArrasteLista}
            onPointerCancel={encerrarArrasteLista}
            aria-label="Arraste para ajustar a altura da lista de escolas"
            className="mx-auto flex h-8 w-full touch-none cursor-ns-resize items-center justify-center xl:cursor-default"
          >
            <span className="h-1 w-10 rounded-full bg-slate-300" />
          </button>
          <p className="px-5 pb-3 text-sm font-semibold text-[#0257a0]">
            <MapPin className="mr-2 inline size-4 text-[#4e8afb]" />
            {escolas.length} escolas prontas para te receber
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
          <div className="space-y-4">
            {escolasOrdenadas.map((escola, indice) => (
              <CartaoEscola
                key={escola.id}
                escola={escola}
                nivel={nivel}
                destaque={Boolean(localizacao) && indice === 0}
                ativo={idSelecionado === escola.id}
                referencia={(elemento) => {
                  referencias.current[escola.id] = elemento;
                }}
                onSelecionar={() => selecionar(escola.id)}
                onAbrir={() => {
                  interromper();
                  sessionStorage.setItem("eja-escola-selecionada", JSON.stringify(escola));
                  onDetalhes(escola.id);
                }}
                leituraAtiva={ativo}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

type CartaoProps = {
  escola: Escola;
  nivel: Turno["nivel"];
  destaque: boolean;
  ativo: boolean;
  referencia: (elemento: HTMLDivElement | null) => void;
  onSelecionar: () => void;
  onAbrir: () => void;
  leituraAtiva: boolean;
};

function CartaoEscola({
  escola,
  nivel,
  destaque,
  ativo,
  referencia,
  onSelecionar,
  onAbrir,
  leituraAtiva,
}: CartaoProps) {
  const turnos = escola.turnos.filter((turno) => turno.nivel === nivel);
  const beneficios = [...new Set(turnos.flatMap((turno) => turno.auxilios))];
  const pacote = `${textoParaAudio(escola.nome)}. Fica no bairro ${escola.bairro}, em ${escola.cidade}. Turnos disponíveis: ${turnos.map((turno) => turno.turno).join(", ") || "não informado"}. Benefícios oferecidos: ${beneficios.join(", ") || "não informado"}. Toque em Ver escola para continuar.`;

  return (
    <div
      ref={referencia}
      onClick={onSelecionar}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${ativo ? "border-[#008bff] ring-2 ring-[#008bff]/20" : "border-slate-200"}`}
    >
      <FotosDaEscola escola={escola} destaque={destaque} />
      <div className="p-4">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-[17px] font-black text-[#1e293b]">{escola.nome}</h2>
          {leituraAtiva && (
            <BotaoAudio modo="ouvir" texto={pacote} ariaLabel={`Ouvir detalhes de ${escola.nome}`} interromperEvento className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#008bff] hover:bg-[#d6e8fa] disabled:cursor-wait disabled:opacity-75" />
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">{escola.bairro} · {escola.cidade}</p>
        <p className="mt-4 text-[11px] font-bold text-slate-500">TURNOS DISPONÍVEIS</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {turnos.map((turno) => (
            <span
              data-turno-disponivel
              key={turno.id}
              className="inline-flex items-center gap-1 rounded-full bg-[#e6f0fa] px-2 py-1 text-xs font-bold text-[#0257a0]"
            >
              <Clock3 className="size-3" />
              {turno.turno}
            </span>
          ))}
        </div>
        {beneficios.length > 0 && (
          <>
            <p className="mt-3 text-[11px] font-bold text-slate-500">BENEFÍCIOS OFERECIDOS</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {beneficios.map((beneficio) => (
                <span
                  key={beneficio}
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700"
                >
                  <CheckCircle2 className="size-3" />
                  {beneficio}
                </span>
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={(evento) => {
            evento.stopPropagation();
            onAbrir();
          }}
          className="mt-4 w-full rounded-xl bg-[#008bff] py-3 font-bold text-white"
        >
          Ver escola
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">Inscrição gratuita · sem burocracia</p>
      </div>
    </div>
  );
}

function FotosDaEscola({ escola, destaque }: { escola: Escola; destaque: boolean }) {
  const fotos = escola.imagens?.length ? escola.imagens : [escola.imagem];
  const [fotoAtual, setFotoAtual] = useState(0);
  const [inicioToque, setInicioToque] = useState<number | null>(null);
  const trocar = (direcao: number) => {
    setFotoAtual((atual) => (atual + direcao + fotos.length) % fotos.length);
  };

  return (
    <div
      onTouchStart={(evento) => setInicioToque(evento.touches[0]?.clientX ?? null)}
      onTouchEnd={(evento) => {
        const fim = evento.changedTouches[0]?.clientX;
        if (inicioToque !== null && fim !== undefined && Math.abs(fim - inicioToque) >= 40) {
          trocar(fim < inicioToque ? 1 : -1);
        }
        setInicioToque(null);
      }}
      className="relative h-36 overflow-hidden bg-slate-200"
    >
      <img
        draggable={false}
        src={fotos[fotoAtual]}
        alt={`Foto de ${escola.nome}`}
        className="size-full select-none object-cover"
        onError={(evento) => {
          evento.currentTarget.style.display = "none";
        }}
      />
      {destaque && (
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#0257a0]">
          MAIS PRÓXIMA
        </span>
      )}
      {fotos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(evento) => {
              evento.stopPropagation();
              trocar(-1);
            }}
            className="absolute inset-y-0 left-0 hidden items-center px-5 text-5xl font-bold text-white drop-shadow md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(evento) => {
              evento.stopPropagation();
              trocar(1);
            }}
            className="absolute inset-y-0 right-0 hidden items-center px-5 text-5xl font-bold text-white drop-shadow md:flex"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {fotos.map((_, indice) => (
              <span
                key={indice}
                className={`size-1.5 rounded-full ${indice === fotoAtual ? "bg-white" : "bg-white/55"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
