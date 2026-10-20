import { apiRequest } from '@/lib/api';
import type {
  CancelarCitaInput,
  CitaResponse,
  CitasResponse,
  CreateCitaTallerInput,
  EstadoCitaInput,
  ReprogramarCitaInput,
} from '@/types/citaTaller';

export interface CitasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

function queryString(filtro?: CitasFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.vehiculoId) params.set('vehiculoId', filtro.vehiculoId);
  if (filtro.estado) params.set('estado', filtro.estado);
  if (filtro.fechaDesde) params.set('fechaDesde', filtro.fechaDesde);
  if (filtro.fechaHasta) params.set('fechaHasta', filtro.fechaHasta);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de citas del taller (HU13). */
export const citasTallerService = {
  list: (filtro?: CitasFiltro) => apiRequest<CitasResponse>(`/api/citas-taller${queryString(filtro)}`),

  get: (citaId: string) => apiRequest<CitaResponse>(`/api/citas-taller/${citaId}`),

  create: (input: CreateCitaTallerInput) =>
    apiRequest<CitaResponse>('/api/citas-taller', { method: 'POST', body: input }),

  confirmar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/confirmar`, { method: 'POST', body: input }),

  reprogramar: (citaId: string, input: ReprogramarCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/reprogramar`, { method: 'POST', body: input }),

  iniciar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/iniciar`, { method: 'POST', body: input }),

  finalizar: (citaId: string, input: EstadoCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/finalizar`, { method: 'POST', body: input }),

  cancelar: (citaId: string, input: CancelarCitaInput) =>
    apiRequest<CitaResponse>(`/api/citas-taller/${citaId}/cancelar`, { method: 'POST', body: input }),
};

export type { CitaTaller, EstadoCita, TipoServicioCita } from '@/types/citaTaller';
