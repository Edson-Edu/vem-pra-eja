"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { LockKeyhole, UserRound } from "lucide-react";
import { administradorEstaLogado, entrarComoAdministrador, sairDaAreaAdministrativa } from "../lib/admin-auth";
import PainelAdministrativo from "./PainelAdministrativo";

export default function PaginaAdmin() {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    administradorEstaLogado()
      .then(setAutenticado)
      .finally(() => setVerificando(false));
  }, []);

  useEffect(() => {
    const encerrarSessao = () => sairDaAreaAdministrativa();
    window.addEventListener("pagehide", encerrarSessao);
    return () => window.removeEventListener("pagehide", encerrarSessao);
  }, []);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    setEnviando(true);
    try {
      const entrou = await entrarComoAdministrador(email, senha);
      if (!entrou) {
        setErro("Usuário ou senha inválidos.");
        return;
      }
      setAutenticado(true);
      setSenha("");
    } catch {
      setErro("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) {
    return <main className="min-h-dvh bg-fundo-claro" />;
  }

  if (autenticado) {
    return <PainelAdministrativo />;
  }

  return (
    <main className="eja-admin-login-fundo grid min-h-dvh place-items-center p-5">
      <form onSubmit={entrar} className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_24px_70px_rgba(30,91,184,0.15)] sm:p-10">
        <header className="text-center">
          <Image
            src="/marca/vem-pra-eja-logo-3.png"
            alt="Vem pra EJA"
            width={1400}
            height={588}
            priority
            sizes="(max-width: 640px) 220px, 240px"
            className="mx-auto h-auto w-[220px] sm:w-[240px]"
          />
          <span aria-hidden="true" className="mx-auto mt-5 block h-1 w-16 rounded-full bg-gradient-to-r from-verde-marca via-laranja-marca to-azul-principal" />
          <h1 className="mt-5 text-3xl font-black text-slate-800">Área administrativa</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Entre com seu e-mail institucional.</p>
        </header>

        <label className="mt-7 block text-sm font-bold text-slate-700" htmlFor="email">E-mail</label>
        <div className="relative mt-2">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-azul-secundario" aria-hidden="true" />
          <input id="email" type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} autoComplete="username" required className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-slate-800 outline-none transition focus:border-azul-acao focus:ring-4 focus:ring-azul-foco" placeholder="nome@bc.sc.gov.br" />
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-700" htmlFor="senha">Senha</label>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-azul-secundario" aria-hidden="true" />
          <input id="senha" type="password" value={senha} onChange={(evento) => setSenha(evento.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-slate-800 outline-none transition focus:border-azul-acao focus:ring-4 focus:ring-azul-foco" placeholder="Digite sua senha" />
        </div>

        {erro && <p role="alert" className="mt-4 text-center text-sm font-bold text-red-600">{erro}</p>}
        <button disabled={enviando} className="mt-7 w-full rounded-xl bg-azul-principal py-3.5 font-black text-white shadow-lg shadow-azul-principal/20 transition hover:brightness-90 disabled:cursor-wait disabled:opacity-70">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
