import type { Metadata } from "next";
import "./globals.css";
import "./tipografia.css";
import ControlesGlobais from "./components/ControlesGlobais";
import RegistroAcessos from "./components/RegistroAcessos";

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
        <RegistroAcessos />
      </body>
    </html>
  );
}
