import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import ControlesGlobais from "./components/ControlesGlobais";

const idDoGoogleAnalytics = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? "G-SEU_CODIGO_AQUI";

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
        <ControlesGlobais />
        {idDoGoogleAnalytics !== "G-SEU_CODIGO_AQUI" && <GoogleAnalytics gaId={idDoGoogleAnalytics} />}
      </body>
    </html>
  );
}
