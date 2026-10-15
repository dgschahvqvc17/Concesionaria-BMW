import { apiRequest } from '@/lib/api';
import type {
  CreateMovimientoInput,
  MovimientoResponse,
  MovimientosResponse,
  TipoMovimiento,
} from '@/types/repuesto';

export interface MovimientosFiltro {
  repuestoId?: string;
  tipo?: TipoMovimiento;
}

function aQueryString(filtro?: MovimientosFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.repuestoId) params.set('repuestoId', filtro.repuestoId);
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Acceso a los endpoints de movimientos de inventario (HU04). */
export const movimientosService = {
  list: (filtro?: MovimientosFiltro) =>
    apiRequest<MovimientosResponse>(`/api/movimientos${aQueryString(filtro)}`),

  create: (input: CreateMovimientoInput) =>
    apiRequest<MovimientoResponse>('/api/movimientos', { method: 'POST', body: input }),
};
