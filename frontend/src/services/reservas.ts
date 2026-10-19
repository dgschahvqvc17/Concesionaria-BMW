import { apiRequest } from '@/lib/api';
import type {
  CancelarReservaInput,
  ConvertirReservaInput,
  CreateReservaInput,
  ReservaResponse,
  ReservasResponse,
} from '@/types/reserva';

export interface ReservasFiltro {
  clienteId?: string;
  vehiculoId?: string;
  estado?: string;
}

function queryString(filtro?: ReservasFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.clienteId) params.set('clienteId', filtro.clienteId);
  if (filtro.vehiculoId) params.set('vehiculoId', filtro.vehiculoId);
  if (filtro.estado) params.set('estado', filtro.estado);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de reservas de vehículos (HU09). */
export const reservasService = {
  list: (filtro?: ReservasFiltro) => apiRequest<ReservasResponse>(`/api/reservas${queryString(filtro)}`),

  get: (reservaId: string) => apiRequest<ReservaResponse>(`/api/reservas/${reservaId}`),

  create: (input: CreateReservaInput) =>
    apiRequest<ReservaResponse>('/api/reservas', { method: 'POST', body: input }),

  cancelar: (reservaId: string, input: CancelarReservaInput) =>
    apiRequest<ReservaResponse>(`/api/reservas/${reservaId}/cancelar`, { method: 'POST', body: input }),

  convertir: (reservaId: string, input: ConvertirReservaInput) =>
    apiRequest<ReservaResponse>(`/api/reservas/${reservaId}/convertir`, { method: 'POST', body: input }),
};

export type { Reserva, EstadoReserva } from '@/types/reserva';
