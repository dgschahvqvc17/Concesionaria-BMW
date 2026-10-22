/** Tipos de operación registrados en auditoría (HU18). */
export type TipoOperacionAuditoria =
  | 'auth'
  | 'usuario'
  | 'vehiculo'
  | 'repuesto'
  | 'movimiento'
  | 'cliente_comercial'
  | 'cotizacion'
  | 'reserva'
  | 'venta'
  | 'prueba_manejo'
  | 'notificacion'
  | 'cita_taller'
  | 'reporte'
  | 'sistema';

/** Registro de actividad del sistema (HU18). */
export interface EventoAuditoria {
  eventoId: string;
  fecha: string;
  fechaHora: string;
  usuarioId: string | null;
  usuarioNombre: string;
  usuarioEmail: string | null;
  roles: string[];
  accion: string;
  tipo: TipoOperacionAuditoria | string;
  recursoTipo: string | null;
  recursoId: string | null;
  descripcion: string;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Filtros para consultar el registro de auditoría (HU18). */
export interface FiltroAuditoria {
  usuarioId?: string;
  tipo?: TipoOperacionAuditoria;
  recursoTipo?: string;
  recursoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Respuesta del listado de auditoría (HU18). */
export interface AuditoriaResponse {
  total: number;
  eventos: EventoAuditoria[];
}
