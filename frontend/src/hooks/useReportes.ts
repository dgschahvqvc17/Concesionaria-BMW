import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/lib/api';
import { reportesService } from '@/services/reportes';
import type { ReporteFiltro, ReporteResumen } from '@/types/reporte';

/** Hook que carga el resumen de reportes de gestión (HU17). */
export function useReportes(filtro: ReporteFiltro = {}) {
  const { fechaDesde, fechaHasta } = filtro;

  const [reporte, setReporte] = useState<ReporteResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (filtros?: ReporteFiltro) => {
      setLoading(true);
      setError(null);
      try {
        const datos = await reportesService.resumen(filtros ?? { fechaDesde, fechaHasta });
        setReporte(datos);
        return datos;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fechaDesde, fechaHasta]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { reporte, loading, error, recargar: cargar };
}
