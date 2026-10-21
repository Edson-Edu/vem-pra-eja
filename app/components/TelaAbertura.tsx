"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, GraduationCap } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import { useLocalizacaoUsuario } from "../lib/localizacao";
import { buscarEscolas } from "../lib/supabase-client";
import { useMenuAcessibilidadeAberto } from "./estadoMenuAcessibilidade";

type TelaAberturaProps = {
  /** Executado após o fade final. Use para abrir a próxima tela. */
  onComplete?: () => void;
};

/**
 * Equivalente ao precacheImage do Flutter: baixa e decodifica a imagem sem
 * renderizá-la. Quando o carrossel do mapa a usar, o navegador já a terá no
 * cache de memória/disco.
 */
function precarregarImagem(url: string) {
  return new Promise<void>((concluir) => {
    const imagem = new window.Image();
    const finalizar = () => concluir();
    imagem.addEventListener("load", () => {
      // decode evita que a primeira troca do carrossel tenha o custo de
      // decodificar a foto, além de baixá-la antecipadamente.
      if (typeof imagem.decode === "function") {
        void imagem.decode().catch(() => undefined).finally(finalizar);
      } else {
        finalizar();
      }
    }, { once: true });
    imagem.addEventListener("error", finalizar, { once: true });
    imagem.src = url;
  });
}

export default function TelaAbertura({ onComplete }: TelaAberturaProps) {
  const menuAberto = useMenuAcessibilidadeAberto();
  const reduzirMovimento = useReducedMotion();
  const [saindo, setSaindo] = useState(false);
  const { solicitarLocalizacao } = useLocalizacaoUsuario({ solicitarAutomaticamente: false });
  const [semLogoPrefeitura, setSemLogoPrefeitura] = useState(false);
  const [semLogoIfc, setSemLogoIfc] = useState(false);
  const [animacaoConcluida, setAnimacaoConcluida] = useState(false);
  const [localizacaoRespondida, setLocalizacaoRespondida] = useState(false);

  useEffect(() => {
    // A tela do mapa pode listar escolas dos dois níveis. Carregamos as fotos
    // atuais do Supabase já durante a abertura, sem atrasar a animação nem a
    // solicitação de localização.
    void Promise.all([
      buscarEscolas("Ensino Fundamental"),
      buscarEscolas("Ensino Médio"),
    ])
      .then((listas) => {
        const urls = new Set(
          listas.flatMap((escolas) => escolas.flatMap((escola) =>
            escola.imagens?.length ? escola.imagens : [escola.imagem],
          )),
        );
        return Promise.all([...urls].map(precarregarImagem));
      })
      // O cache é uma melhoria de desempenho: se uma imagem ou a conexão
      // falhar, a tela continua normalmente e o carrossel mantém seu onError.
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!onComplete) return;

    // Primeiro a pessoa vê a abertura. Depois aparece a pergunta do navegador
    // e a tela só avança quando ela tiver respondido e a animação mínima acabar.
    const pedirLocalizacao = window.setTimeout(() => {
      void solicitarLocalizacao().finally(() => setLocalizacaoRespondida(true));
    }, 2600);
    const fimDaAnimacao = window.setTimeout(() => setAnimacaoConcluida(true), 5200);
    return () => {
      window.clearTimeout(pedirLocalizacao);
      window.clearTimeout(fimDaAnimacao);
    };
  }, [onComplete, solicitarLocalizacao]);

  useEffect(() => {
    if (!onComplete || !animacaoConcluida || !localizacaoRespondida || menuAberto) return;
    const inicioSaida = window.setTimeout(() => setSaindo(true), 350);
    const fimSaida = window.setTimeout(onComplete, 1000);
    return () => {
      window.clearTimeout(inicioSaida);
      window.clearTimeout(fimSaida);
    };
  }, [animacaoConcluida, localizacaoRespondida, onComplete, menuAberto]);

  return (
    <>
      <AnimatePresence>
      {!saindo && (
        <motion.main
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeIn" }}
          className="relative flex min-h-dvh flex-col overflow-hidden bg-azul-principal"
        >
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <motion.i
              animate={reduzirMovimento ? undefined : { scale: [1, 1.12, 1], x: [0, 18, 0], y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-24 top-[14%] size-72 rounded-full bg-verde-marca/25 blur-3xl md:size-96"
            />
            <motion.i
              animate={reduzirMovimento ? undefined : { scale: [1.08, 0.96, 1.08], x: [0, -14, 0], y: [0, 16, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-28 bottom-[12%] size-72 rounded-full bg-laranja-marca/25 blur-3xl md:size-[28rem]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,40,92,0.2)_72%,rgba(9,40,92,0.36)_100%)]" />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-48 pt-24 md:px-12 md:pb-52">
            <div className="eja-logo-entrada relative w-full max-w-[760px]">
              <i aria-hidden="true" className="eja-logo-halo absolute inset-[8%] rounded-[40%] border border-white/45" />
              <div className="eja-logo-revelacao relative overflow-hidden">
                <Image
                  src="/marca/vem-pra-eja-logo-2.png"
                  alt="Vem pra EJA"
                  width={1400}
                  height={762}
                  priority
                  sizes="(max-width: 768px) 88vw, 760px"
                  className="h-auto w-full select-none object-contain drop-shadow-[0_18px_42px_rgba(4,31,75,0.28)]"
                />
              </div>
            </div>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.45 }}
            className="absolute bottom-[30px] left-0 right-0 flex flex-col items-center"
          >
            <div className="relative h-1.5 w-[84px] overflow-hidden rounded-full bg-white/20">
              <motion.span
                animate={reduzirMovimento ? undefined : { x: ["-100%", "310%"] }}
                transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-7 rounded-full bg-gradient-to-r from-verde-marca via-white to-laranja-marca"
              />
            </div>
            <span className="mt-3 text-base font-semibold tracking-[2px] text-white/70">Carregando...</span>

            <div className="mt-[50px] flex items-center gap-[25px] opacity-85">
              {semLogoPrefeitura ? (
                <Building2 aria-label="Prefeitura" className="h-[55px] w-[55px] text-white/70" />
              ) : (
                <Image src="/logos/logo_prefeitura.png" alt="Prefeitura" width={1920} height={1080} style={{ height: "55px", width: "auto" }} className="object-contain" onError={() => setSemLogoPrefeitura(true)} />
              )}
              <span aria-hidden="true" className="h-[45px] w-px bg-white/25" />
              {semLogoIfc ? (
                <GraduationCap aria-label="Instituto Federal Catarinense" className="h-[65px] w-[65px] translate-y-2 text-white/70" />
              ) : (
                <Image src="/logos/logo_ifc.png" alt="Instituto Federal Catarinense" width={1920} height={1080} style={{ height: "65px", width: "auto" }} className="translate-y-2 object-contain" onError={() => setSemLogoIfc(true)} />
              )}
            </div>
          </motion.footer>
        </motion.main>
      )}
      </AnimatePresence>
      {/* Fica fora do fade da abertura: o controle permanece visível até a
          rota Nível renderizar seu controle global na mesma posição. */}
      <BotaoAudio
        texto="Seja bem-vindo. Estamos carregando as informações para você."
        ariaLabel="Ativar audiodescrição"
        tamanhoIcone={24}
        className="flex cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/15 text-white transition-colors hover:bg-white/25 disabled:cursor-wait disabled:opacity-75"
      />
    </>
  );
}
