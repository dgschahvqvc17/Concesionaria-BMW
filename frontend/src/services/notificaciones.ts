import { apiRequest } from '@/lib/api';
import type {
  EnviarNotificacionResponse,
  NotificacionResponse,
  NotificacionesResponse,
  TipoNotificacion,
  EstadoNotificacion,
} from '@/types/notificacion';

export interface NotificacionesFiltro {
  tipo?: TipoNotificacion;
  estado?: EstadoNotificacion;
  recursoId?: string;
}

function queryString(filtro?: NotificacionesFiltro): string {
  if (!filtro) return '';
  const params = new URLSearchParams();
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.estado) params.set('estado', filtro.estado);
  if (filtro.recursoId) params.set('recursoId', filtro.recursoId);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Acceso a los endpoints de notificaciones por correo (HU12). */
export const notificacionesService = {
  list: (filtro?: NotificacionesFiltro) =>
    apiRequest<NotificacionesResponse>(`/api/notificaciones${queryString(filtro)}`),

  get: (eventoId: string) => apiRequest<NotificacionResponse>(`/api/notificaciones/${encodeURIComponent(eventoId)}`),

  /** Registra el intento de envío y devuelve el enlace `mailto:` redactado. */
  enviar: (eventoId: string) =>
    apiRequest<EnviarNotificacionResponse>(`/api/notificaciones/${encodeURIComponent(eventoId)}/enviar`, {
      method: 'POST',
    }),

  /** Envío de cotización solicitado por el vendedor (HU08 + HU12). */
  enviarCotizacion: (cotizacionId: string) =>
    apiRequest<EnviarNotificacionResponse>(`/api/cotizaciones/${cotizacionId}/enviar-correo`, { method: 'POST' }),
};

export type { Notificacion, TipoNotificacion, EstadoNotificacion } from '@/types/notificacion';
