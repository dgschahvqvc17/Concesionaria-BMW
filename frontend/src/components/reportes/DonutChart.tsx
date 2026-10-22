import { COLORES_SERIE } from '@/lib/reportes';
import { cn } from '@/lib/utils';

interface DonutChartProps {
  datos: { etiqueta: string; valor: number }[];
  className?: string;
}

/**
 * Gráfico de dona en SVG puro (sin dependencias) con leyenda para los reportes
 * de gestión (HU17). Cada segmento muestra su valor accesible vía `<title>`.
 */
export function DonutChart({ datos, className }: DonutChartProps) {
  const total = datos.reduce((acc, dato) => acc + dato.valor, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para el período.</p>
    );
  }

  const radio = 60;
  const grosor = 22;
  const circunferencia = 2 * Math.PI * radio;
  let offset = 0;

  return (
    <div className={cn('flex flex-col items-center gap-6 sm:flex-row sm:justify-center', className)}>
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label="Distribución">
        <g transform="rotate(-90 80 80)">
          {datos.map((dato, indice) => {
            const fraccion = dato.valor / total;
            const largo = fraccion * circunferencia;
            const color = COLORES_SERIE[indice % COLORES_SERIE.length];
            const dash = `${largo} ${circunferencia - largo}`;
            const elemento = (
              <circle
                key={dato.etiqueta}
                cx="80"
                cy="80"
                r={radio}
                fill="none"
                stroke={color}
                strokeWidth={grosor}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              >
                <title>{`${dato.etiqueta}: ${dato.valor}`}</title>
              </circle>
            );
            offset += largo;
            return elemento;
          })}
        </g>
        <text x="80" y="76" textAnchor="middle" className="fill-foreground text-2xl font-semibold">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-muted-foreground text-[10px] uppercase tracking-wide">
          Total
        </text>
      </svg>

      <ul className="space-y-2 text-sm">
        {datos.map((dato, indice) => (
          <li key={dato.etiqueta} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORES_SERIE[indice % COLORES_SERIE.length] }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{dato.etiqueta}</span>
            <span className="font-semibold">{dato.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
