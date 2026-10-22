import { cn } from '@/lib/utils';

interface BarChartProps {
  datos: { etiqueta: string; valor: number }[];
  color?: string;
  /** Formatea el valor mostrado en el tooltip/aria (p. ej. moneda). */
  formatearValor?: (valor: number) => string;
  className?: string;
  /** Altura del área de dibujo en px. */
  alto?: number;
}

/**
 * Gráfico de barras en SVG puro (sin dependencias) para los reportes de gestión
 * (HU17). Cada barra muestra su valor accesible vía `<title>`.
 */
export function BarChart({
  datos,
  color = '#1d6fd8',
  formatearValor = (valor) => String(valor),
  className,
  alto = 200,
}: BarChartProps) {
  if (datos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para el período.</p>
    );
  }

  const maximo = Math.max(...datos.map((d) => d.valor), 1);
  const anchoBarra = 100 / datos.length;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-2" style={{ height: alto }}>
        {datos.map((dato) => {
          const porcentaje = (dato.valor / maximo) * 100;
          return (
            <div
              key={dato.etiqueta}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: '100%' }}
            >
              <span className="mb-1 text-[11px] font-semibold text-foreground">
                {formatearValor(dato.valor)}
              </span>
              <div
                className="w-full rounded-t-md bg-current transition-all duration-300 group-hover:opacity-80"
                style={{
                  height: `${Math.max(porcentaje, 2)}%`,
                  color,
                  minHeight: 4,
                }}
                role="img"
                aria-label={`${dato.etiqueta}: ${formatearValor(dato.valor)}`}
                title={`${dato.etiqueta}: ${formatearValor(dato.valor)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {datos.map((dato) => (
          <span
            key={dato.etiqueta}
            className="flex-1 truncate text-center text-[11px] text-muted-foreground"
            style={{ width: `${anchoBarra}%` }}
          >
            {dato.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}
