"use client";

import { usePathname } from "next/navigation";
import BotaoAltoContraste from "./BotaoAltoContraste";
import BotaoVLibras from "./BotaoVLibras";
import GerenciadorFeedbackAudio from "./GerenciadorFeedbackAudio";

export default function ControlesGlobais() {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <>
      <GerenciadorFeedbackAudio />
      <BotaoAltoContraste />
      <BotaoVLibras />
    </>
  );
}
