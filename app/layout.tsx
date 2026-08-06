import type { Metadata } from "next";
import "./globals.css";
import BotaoAltoContraste from "./components/BotaoAltoContraste";
import BotaoVLibras from "./components/BotaoVLibras";
import GerenciadorFeedbackAudio from "./components/GerenciadorFeedbackAudio";

export const metadata: Metadata = {
  title: "Vem pra EJA",
  description: "Plataforma de matrículas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <GerenciadorFeedbackAudio />
        <BotaoAltoContraste />
        <BotaoVLibras />
      </body>
    </html>
  );
}
