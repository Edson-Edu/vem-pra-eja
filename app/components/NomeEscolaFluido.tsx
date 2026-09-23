"use client";

import TextoAcessivel from "./TextoAcessivel";

/** Nomes compridos quebram linha, preservando o tamanho escolhido para ler. */
export default function NomeEscolaFluido({ nome, leitura }: { nome: string; leitura: string }) {
  return <span className="eja-nome-escola-fluido"><TextoAcessivel texto={nome} textoOcultoParaLer={leitura} corIcone="text-azul-secundario" /></span>;
}
