export type TipoNotificacion = 'reserva' | 'cotizacion' | 'prueba_manejo' | 'venta';

export type EstadoNotificacion = 'pendiente' | 'intentado' | 'fallido' | 'omitido';

export interface NotificacionIntento {
  fecha: string;
  resultado: string;
  detalle?: string;
}

export interface Notificacion {
  eventoId: string;
  tipo: TipoNotificacion;
  evento: string;
  recursoId: string;
  numero: string | null;
  destinatario: string | null;
  destinatarioNombre: string | null;
  asunto: string;
  cuerpo: string;
  estado: EstadoNotificacion;
  intentos: number;
  maxIntentos: number;
  historial: NotificacionIntento[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificacionesResponse {
  total: number;
  notificaciones: Notificacion[];
}

export interface NotificacionResponse {
  notificacion: Notificacion;
}

export interface EnviarNotificacionResponse {
  message: string;
  notificacion: Notificacion;
  mailto: string;
}
