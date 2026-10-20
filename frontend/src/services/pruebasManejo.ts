import { apiRequest, publicRequest } from '@/lib/api';
import type {
  CancelarPruebaInput,
  ConfirmarPruebaInput,
  CreatePruebaManejoInput,
  PruebaResponse,
  PruebasResponse,
  RealizarPruebaInput,
  ReprogramarPruebaInput,
} from '@/types/pruebaManejo';

export interface PruebasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: string;
}

function queryString(filtro?: PruebasFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.vehiculoId) params.set('vehiculoId', filtro.vehiculoId);
  if (filtro.estado) params.set('estado', filtro.estado);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de pruebas de manejo (HU11). */
export const pruebasManejoService = {
  list: (filtro?: PruebasFiltro) => apiRequest<PruebasResponse>(`/api/pruebas-man${queryString(filtro)}`),

  get: (pruebaId: string) => apiRequest<PruebaResponse>(`/api/pruebas-man/${pruebaId}`),

  create: (input: CreatePruebaManejoInput) =>
    apiRequest<PruebaResponse>('/api/pruebas-man', { method: 'POST', body: input }),

  /** Solicitud pública desde el catálogo: sin token, el backend la registra con origen `catalogo`. */
  solicitar: (input: CreatePruebaManejoInput) =>
    publicRequest<PruebaResponse>('/api/pruebas-man', { method: 'POST', body: input }),

  confirmar: (pruebaId: string, input: ConfirmarPruebaInput) =>
    apiRequest<PruebaResponse>(`/api/pruebas-man/${pruebaId}/confirmar`, { method: 'POST', body: input }),

  reprogramar: (pruebaId: string, input: ReprogramarPruebaInput) =>
    apiRequest<PruebaResponse>(`/api/pruebas-man/${pruebaId}/reprogramar`, { method: 'POST', body: input }),

  cancelar: (pruebaId: string, input: CancelarPruebaInput) =>
    apiRequest<PruebaResponse>(`/api/pruebas-man/${pruebaId}/cancelar`, { method: 'POST', body: input }),

  realizar: (pruebaId: string, input: RealizarPruebaInput) =>
    apiRequest<PruebaResponse>(`/api/pruebas-man/${pruebaId}/realizar`, { method: 'POST', body: input }),
};

export type { PruebaManejo, EstadoPrueba } from '@/types/pruebaManejo';
