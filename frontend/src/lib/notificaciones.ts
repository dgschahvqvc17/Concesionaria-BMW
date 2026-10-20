import type { EstadoNotificacion, TipoNotificacion } from '@/types/notificacion';

export const TIPOS_NOTIFICACION: TipoNotificacion[] = ['reserva', 'cotizacion', 'prueba_manejo', 'venta', 'cita_taller'];

export const TIPO_NOTIFICACION_LABELS: Record<TipoNotificacion, string> = {
  reserva: 'Reserva',
  cotizacion: 'Cotización',
  prueba_manejo: 'Prueba de manejo',
  venta: 'Venta',
  cita_taller: 'Cita del taller',
};

export const ESTADOS_NOTIFICACION: EstadoNotificacion[] = ['pendiente', 'intentado', 'fallido', 'omitido'];

export const ESTADO_NOTIFICACION_LABELS: Record<EstadoNotificacion, string> = {
  pendiente: 'Pendiente',
  intentado: 'Intentado',
  fallido: 'Fallido',
  omitido: 'Sin correo',
};

/** Clases de color por estado, alineadas a los primitivos. */
export const ESTADO_NOTIFICACION_STYLES: Record<EstadoNotificacion, string> = {
  pendiente: 'border-transparent bg-amber-500/10 text-amber-700',
  intentado: 'border-transparent bg-sky-500/10 text-sky-700',
  fallido: 'border-transparent bg-rose-500/10 text-rose-700',
  omitido: 'border-transparent bg-slate-500/10 text-slate-700',
};

export const EVENTO_NOTIFICACION_LABELS: Record<string, string> = {
  reserva_alta: 'Reserva creada',
  reserva_cancelada: 'Reserva cancelada',
  reserva_convertida: 'Reserva convertida en venta',
  cotizacion_envio: 'Cotización enviada',
  cotizacion_aceptada: 'Cotización aceptada',
  cotizacion_rechazada: 'Cotización rechazada',
  prueba_solicitada: 'Prueba solicitada',
  prueba_confirmada: 'Prueba confirmada',
  prueba_reprogramada: 'Prueba reprogramada',
  prueba_cancelada: 'Prueba cancelada',
  prueba_realizada: 'Prueba realizada',
  venta_confirmada: 'Venta confirmada',
  venta_confirmada_vendedor: 'Venta registrada (aviso interno)',
  cita_solicitada: 'Cita solicitada',
  cita_confirmada: 'Cita confirmada',
  cita_reprogramada: 'Cita reprogramada',
  cita_cancelada: 'Cita cancelada',
  cita_finalizada: 'Cita finalizada',
};

export function eventoLabel(evento: string): string {
  return EVENTO_NOTIFICACION_LABELS[evento] ?? evento;
}

/** Abre el cliente de correo del usuario con el mensaje ya redactado. */
export function abrirMailto(mailto: string): void {
  window.location.href = mailto;
}
