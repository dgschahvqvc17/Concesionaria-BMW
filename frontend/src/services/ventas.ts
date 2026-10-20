import { apiRequest } from '@/lib/api';
import type { CreateVentaInput, VentaResponse, VentasResponse } from '@/types/venta';

export interface VentasFiltro {
  clienteId?: string;
  vehiculoId?: string;
}

function queryString(filtro?: VentasFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.vehiculoId) params.set('vehiculoId', filtro.vehiculoId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de ventas (HU10). */
export const ventasService = {
  list: (filtro?: VentasFiltro) => apiRequest<VentasResponse>(`/api/ventas${queryString(filtro)}`),

  get: (ventaId: string) => apiRequest<VentaResponse>(`/api/ventas/${ventaId}`),

  create: (input: CreateVentaInput) =>
    apiRequest<VentaResponse>('/api/ventas', { method: 'POST', body: input }),
};

export type { Venta } from '@/types/venta';
