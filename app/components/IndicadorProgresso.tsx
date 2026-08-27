type Props = {
  etapa: 1 | 2 | 3 | 4;
  concluido?: boolean;
  inverso?: boolean;
  className?: string;
};

const TOTAL_DE_ETAPAS = 4;

export default function IndicadorProgresso({ etapa, concluido = false, inverso = false, className = "" }: Props) {
  const percentual = Math.round((etapa / TOTAL_DE_ETAPAS) * 100);
  const rotulo = concluido ? `Etapa ${etapa} de ${TOTAL_DE_ETAPAS}, concluída` : `Etapa ${etapa} de ${TOTAL_DE_ETAPAS}`;

  return (
    <div
      data-eja-progresso
      data-vlibras-texto={rotulo}
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={1}
      aria-valuemax={TOTAL_DE_ETAPAS}
      aria-valuenow={etapa}
      className={`flex w-full items-center gap-3 ${className}`}
    >
      <span className={`h-2 min-w-0 flex-1 overflow-hidden rounded-full ${inverso ? "bg-white/25" : "bg-slate-200"}`} aria-hidden="true">
        <span className={`block h-full rounded-full transition-[width] duration-500 ${inverso ? "bg-white" : "bg-[#4e8afb]"}`} style={{ width: `${percentual}%` }} />
      </span>
      <strong className={`shrink-0 text-xs font-black ${inverso ? "text-white" : "text-[#0257a0]"}`}>{concluido ? "Concluído" : `${etapa} de ${TOTAL_DE_ETAPAS}`}</strong>
    </div>
  );
}
