import { apiRequest } from '@/lib/api';
import type { AuditoriaResponse, FiltroAuditoria } from '@/types/auditoria';

function queryString(filtro?: FiltroAuditoria): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.usuarioId) params.set('usuarioId', filtro.usuarioId);
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.recursoTipo) params.set('recursoTipo', filtro.recursoTipo);
  if (filtro.recursoId) params.set('recursoId', filtro.recursoId);
  if (filtro.fechaDesde) params.set('fechaDesde', filtro.fechaDesde);
  if (filtro.fechaHasta) params.set('fechaHasta', filtro.fechaHasta);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso al registro de auditoría (HU18). */
export const auditoriaService = {
  list: (filtro?: FiltroAuditoria) => apiRequest<AuditoriaResponse>(`/api/auditoria${queryString(filtro)}`),
};
