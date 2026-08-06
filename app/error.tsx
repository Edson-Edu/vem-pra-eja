"use client";

export default function Erro({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-6 text-white"><div className="max-w-sm text-center"><h1 className="text-2xl font-black">Não foi possível carregar esta tela</h1><p className="mt-3 text-slate-300">Tente novamente. Seus dados ainda não foram enviados.</p><button type="button" onClick={reset} className="mt-6 rounded-xl bg-white px-5 py-3 font-bold text-slate-900">Tentar novamente</button></div></main>; }
