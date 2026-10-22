import { apiRequest } from '@/lib/api';
import type { ReporteFiltro, ReporteResumen } from '@/types/reporte';

function queryString(filtro?: ReporteFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.fechaDesde) params.set('fechaDesde', filtro.fechaDesde);
  if (filtro.fechaHasta) params.set('fechaHasta', filtro.fechaHasta);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de reportes de gestión (HU17). */
export const reportesService = {
  resumen: (filtro?: ReporteFiltro) =>
    apiRequest<ReporteResumen>(`/api/reportes${queryString(filtro)}`),
};
