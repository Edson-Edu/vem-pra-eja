"use client";

import { useCallback, useEffect, useState } from "react";
import type { Escola } from "./escolas";

export type LocalizacaoUsuario = {
  latitude: number;
  longitude: number;
};

export type StatusDaLocalizacao = "carregando" | "disponivel" | "indisponivel";

const chaveDaLocalizacao = "eja-localizacao-usuario";
const duracaoDoCache = 10 * 60 * 1000;

function lerLocalizacaoSalva(): LocalizacaoUsuario | null {
  try {
    const conteudo = sessionStorage.getItem(chaveDaLocalizacao);
    if (!conteudo) return null;
    const valor = JSON.parse(conteudo) as LocalizacaoUsuario & { salvaEm?: number };
    if (!Number.isFinite(valor.latitude) || !Number.isFinite(valor.longitude)) return null;
    if (!valor.salvaEm || Date.now() - valor.salvaEm > duracaoDoCache) return null;
    return { latitude: valor.latitude, longitude: valor.longitude };
  } catch {
    return null;
  }
}

function salvarLocalizacao(localizacao: LocalizacaoUsuario) {
  try {
    sessionStorage.setItem(chaveDaLocalizacao, JSON.stringify({ ...localizacao, salvaEm: Date.now() }));
  } catch {
    // O aplicativo continua funcionando quando o navegador bloqueia o armazenamento.
  }
}

/** Pede a posição uma vez e a reaproveita entre mapa e detalhes na mesma visita. */
type OpcoesDaLocalizacao = { solicitarAutomaticamente?: boolean };

export function useLocalizacaoUsuario({ solicitarAutomaticamente = true }: OpcoesDaLocalizacao = {}) {
  const [localizacao, setLocalizacao] = useState<LocalizacaoUsuario | null>(null);
  const [statusDaLocalizacao, setStatusDaLocalizacao] = useState<StatusDaLocalizacao>("carregando");

  const solicitarLocalizacao = useCallback(() => new Promise<void>((concluir) => {
    const salva = lerLocalizacaoSalva();
    if (salva) {
      setLocalizacao(salva);
      setStatusDaLocalizacao("disponivel");
    }

    if (!("geolocation" in navigator)) {
      if (!salva) setStatusDaLocalizacao("indisponivel");
      concluir();
      return;
    }

    if (!salva) setStatusDaLocalizacao("carregando");
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const atual = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
        salvarLocalizacao(atual);
        setLocalizacao(atual);
        setStatusDaLocalizacao("disponivel");
        concluir();
      },
      () => {
        if (!salva) setStatusDaLocalizacao("indisponivel");
        concluir();
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 12_000 },
    );
  }), []);

  useEffect(() => {
    if (solicitarAutomaticamente) void solicitarLocalizacao();
  }, [solicitarAutomaticamente, solicitarLocalizacao]);

  return { localizacao, statusDaLocalizacao, solicitarLocalizacao };
}

export function distanciaEmMetros(origem: LocalizacaoUsuario, destino: Pick<Escola, "latitude" | "longitude">) {
  const raioDaTerra = 6_371_000;
  const paraRadiano = (graus: number) => graus * Math.PI / 180;
  const latitude = paraRadiano(destino.latitude - origem.latitude);
  const longitude = paraRadiano(destino.longitude - origem.longitude);
  const a = Math.sin(latitude / 2) ** 2
    + Math.cos(paraRadiano(origem.latitude)) * Math.cos(paraRadiano(destino.latitude)) * Math.sin(longitude / 2) ** 2;
  return 2 * raioDaTerra * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatarDistancia(distancia: number) {
  if (distancia < 1000) return `${Math.max(10, Math.round(distancia / 10) * 10)} m de você`;
  return `${(distancia / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km de você`;
}
