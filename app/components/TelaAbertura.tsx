"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, GraduationCap } from "lucide-react";
import BotaoAudio from "./BotaoAudio";
import { useLocalizacaoUsuario } from "../lib/localizacao";
import { buscarEscolas } from "../lib/supabase-client";

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
    if (!onComplete || !animacaoConcluida || !localizacaoRespondida) return;
    const inicioSaida = window.setTimeout(() => setSaindo(true), 350);
    const fimSaida = window.setTimeout(onComplete, 1000);
    return () => {
      window.clearTimeout(inicioSaida);
      window.clearTimeout(fimSaida);
    };
  }, [animacaoConcluida, localizacaoRespondida, onComplete]);

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
          <motion.span
            data-eja-rotulo-acessibilidade
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
              className="pointer-events-none rounded-full border border-white/30 bg-white/15 px-4 text-sm font-semibold text-white md:px-5 md:text-base"
            >
              Acessibilidade
          </motion.span>
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="text-[22px] font-normal tracking-[4px] text-white/60"
              >
                VEM
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, type: "spring", bounce: 0.4 }}
                className="rounded-lg bg-white px-[10px] py-1 text-[18px] font-black tracking-[1px] text-azul-principal"
              >
                PRA
              </motion.span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.7, ease: "easeOut" }}
              className="relative -mt-0.5 overflow-hidden px-2 text-[clamp(6rem,28vw,7.5rem)] font-black leading-none tracking-[-4px] text-white [font-family:Arial_Black,Arial,sans-serif]"
            >
              EJA
              <motion.span
                aria-hidden="true"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ delay: 1.5, duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/90 to-transparent mix-blend-overlay"
              />
            </motion.h1>
          </div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.45 }}
            className="absolute bottom-[30px] left-0 right-0 flex flex-col items-center"
          >
            <div className="relative h-1 w-[60px] overflow-hidden rounded-full bg-white/20">
              <motion.span
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 w-[18px] rounded-full bg-white/80"
              />
            </div>
            <span className="mt-3 text-base font-semibold tracking-[2px] text-white/70">Carregando...</span>

            <div className="mt-[50px] flex items-center gap-[25px] opacity-85">
              {semLogoPrefeitura ? (
                <Building2 aria-label="Prefeitura" className="h-[55px] w-[55px] text-white/70" />
              ) : (
                <Image src="/logo_prefeitura.png" alt="Prefeitura" width={160} height={55} className="h-[55px] w-auto object-contain" onError={() => setSemLogoPrefeitura(true)} />
              )}
              <span aria-hidden="true" className="h-[45px] w-px bg-white/25" />
              {semLogoIfc ? (
                <GraduationCap aria-label="Instituto Federal Catarinense" className="h-[65px] w-[65px] translate-y-2 text-white/70" />
              ) : (
                <Image src="/logo_ifc.png" alt="Instituto Federal Catarinense" width={160} height={65} className="h-[65px] w-auto translate-y-2 object-contain" onError={() => setSemLogoIfc(true)} />
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
