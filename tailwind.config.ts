import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TODO: troque pelo valor real de Paleta.azulPrincipal (paleta.dart)
        azulPrincipal: "#0257A0",
        fundoClaro: "#F2F3F6",
        textoPrincipal: "#1E293B",

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
