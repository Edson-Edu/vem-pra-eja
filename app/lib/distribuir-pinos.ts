type Ponto = { x: number; y: number };
type Limites = { esquerda: number; direita: number; topo: number; base: number };

/** Afasta apenas balões sobrepostos; as coordenadas reais não são alteradas. */
export function distribuirPinos(pontos: Ponto[], limites: Limites, distancia = 54): Ponto[] {
  const ocupados: Ponto[] = [];
  for (const ponto of pontos) {
    const base = {
      x: Math.max(limites.esquerda, Math.min(limites.direita, ponto.x)),
      y: Math.max(limites.topo, Math.min(limites.base, ponto.y)),
    };
    let escolhido = base;
    let encontrado = false;
    for (let anel = 0; anel <= pontos.length && !encontrado; anel++) {
      for (let dx = -anel; dx <= anel && !encontrado; dx++) {
        for (let dy = -anel; dy <= anel; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== anel) continue;
          const candidato = { x: base.x + dx * distancia, y: base.y + dy * distancia };
          if (candidato.x < limites.esquerda || candidato.x > limites.direita || candidato.y < limites.topo || candidato.y > limites.base) continue;
          if (ocupados.some((outro) => Math.hypot(candidato.x - outro.x, candidato.y - outro.y) < distancia)) continue;
          escolhido = candidato;
          encontrado = true;
          break;
        }
      }
    }
    ocupados.push(escolhido);
  }
  return ocupados;
}
