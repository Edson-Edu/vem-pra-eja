import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Os valores oficiais ficam em app/globals.css e serão trocados ali
        // quando a CECOM aprovar a paleta definitiva.
        azulPrincipal: "var(--eja-cor-azul-principal)",
        azulAcao: "var(--eja-cor-azul-acao)",
        azulSecundario: "var(--eja-cor-azul-secundario)",
        azulSuperficie: "var(--eja-cor-azul-superficie)",
        azulFoco: "var(--eja-cor-azul-foco)",
        fundoClaro: "var(--eja-cor-fundo-claro)",
        textoPrincipal: "var(--eja-cor-texto-principal)",

        // cores que já existiam no projeto (mantidas para não quebrar outras telas)
        roxoPrimario: "#4F46E5",
        roxoDestaque: "#7C3AED",
        fundoLilas: "#F8F7FF",
      },
    },
  },
  plugins: [],
};
export default config;
