import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Estes efeitos inicializam estado a partir de APIs do navegador e de
    // serviços externos. Mantê-los evita alterar hidratação, animações e o
    // fluxo responsivo apenas para satisfazer uma regra experimental.
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["tests/**/*.cjs"],
    // Os testes visuais carregam componentes TSX em uma VM CommonJS isolada.
    rules: {
      "@next/next/no-assign-module-variable": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefatos de publicação, inspeção e bibliotecas de terceiros não são
    // código-fonte da aplicação.
    ".codex-backups/**",
    ".codex-presentation/**",
    "public/vlibras/**",
    "azure-function/dist/**",
  ]),
]);

export default eslintConfig;
