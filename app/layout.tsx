import type { Metadata } from "next";
import "./globals.css";
import "./tipografia.css";
import "leaflet/dist/leaflet.css";
import ControlesGlobais from "./components/ControlesGlobais";
import RegistroAcessos from "./components/RegistroAcessos";

export const metadata: Metadata = {
  title: "Vem pra EJA",
  description: "Encontre escolas de Educação de Jovens e Adultos e fale diretamente com a instituição.",
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
        <RegistroAcessos />
      </body>
    </html>
  );
}
