"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { administradorEstaLogado, entrarComoAdministrador, sairDaAreaAdministrativa } from "../lib/admin-auth";
import PainelAdministrativo from "./PainelAdministrativo";

export default function PaginaAdmin() {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [usuario, setUsuario] = useState("");
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

    if (usuario.trim().toLowerCase() !== "admin") {
      setErro("Usuário ou senha inválidos.");
      return;
    }

    setEnviando(true);
    try {
      const entrou = await entrarComoAdministrador(senha);
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
    return <main className="min-h-dvh bg-[#f2f3f6]" />;
  }

  if (autenticado) {
    return <PainelAdministrativo />;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top,#d9ecff,transparent_42%),#f2f3f6] p-5">
      <form onSubmit={entrar} className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-8 shadow-[0_24px_70px_rgba(2,87,160,0.15)] sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#e6f0fa] text-[#0257a0]">
          <LockKeyhole className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-6 text-center text-sm font-black tracking-[0.24em] text-[#008bff]">VEM PRA EJA</p>
        <h1 className="mt-2 text-center text-3xl font-black text-slate-800">Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Área administrativa</p>

        <label className="mt-8 block text-sm font-bold text-slate-700" htmlFor="usuario">Usuário</label>
        <div className="relative mt-2">
          <UserRound className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#4e8afb]" aria-hidden="true" />
          <input id="usuario" value={usuario} onChange={(evento) => setUsuario(evento.target.value)} autoComplete="username" required className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-slate-800 outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder="Admin" />
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-700" htmlFor="senha">Senha</label>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#4e8afb]" aria-hidden="true" />
          <input id="senha" type="password" value={senha} onChange={(evento) => setSenha(evento.target.value)} autoComplete="current-password" required className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-slate-800 outline-none transition focus:border-[#008bff] focus:ring-4 focus:ring-[#d6e8fa]" placeholder="Digite sua senha" />
        </div>

        {erro && <p role="alert" className="mt-4 text-center text-sm font-bold text-red-600">{erro}</p>}
        <button disabled={enviando} className="mt-7 w-full rounded-xl bg-[#0257a0] py-3.5 font-black text-white shadow-lg shadow-[#0257a0]/20 transition hover:bg-[#014884] disabled:cursor-wait disabled:opacity-70">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
