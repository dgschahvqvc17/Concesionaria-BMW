import { apiRequest } from '@/lib/api';
import type {
  CotizacionResponse,
  CotizacionesResponse,
  CreateCotizacionInput,
  UpdateCotizacionInput,
} from '@/types/cotizacion';

export interface CotizacionesFiltro {
  clienteId?: string;
  estado?: string;
}

function queryString(filtro?: CotizacionesFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.estado) params.set('estado', filtro.estado);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de cotizaciones (HU08). */
export const cotizacionesService = {
  list: (filtro?: CotizacionesFiltro) =>
    apiRequest<CotizacionesResponse>(`/api/cotizaciones${queryString(filtro)}`),

  get: (cotizacionId: string) => apiRequest<CotizacionResponse>(`/api/cotizaciones/${cotizacionId}`),

  create: (input: CreateCotizacionInput) =>
    apiRequest<CotizacionResponse>('/api/cotizaciones', { method: 'POST', body: input }),

  update: (cotizacionId: string, input: UpdateCotizacionInput) =>
    apiRequest<CotizacionResponse>(`/api/cotizaciones/${cotizacionId}`, { method: 'PATCH', body: input }),
};

export type { Cotizacion, EstadoCotizacion } from '@/types/cotizacion';
