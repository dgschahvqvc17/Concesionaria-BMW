import type { TipoOperacionAuditoria } from '@/types/auditoria';

export const TIPO_AUDITORIA_LABELS: Record<string, string> = {
  auth: 'Autenticación',
  usuario: 'Usuarios',
  vehiculo: 'Vehículos',
  repuesto: 'Repuestos',
  movimiento: 'Movimientos',
  cliente_comercial: 'Clientes comerciales',
  cotizacion: 'Cotizaciones',
  reserva: 'Reservas',
  venta: 'Ventas',
  prueba_manejo: 'Pruebas de manejo',
  notificacion: 'Notificaciones',
  cita_taller: 'Taller',
  reporte: 'Reportes',
  sistema: 'Sistema',
};

/** Lista de tipos de operación para el filtro (HU18). */
export const TIPOS_AUDITORIA_FILTRO: TipoOperacionAuditoria[] = [
  'auth',
  'usuario',
  'vehiculo',
  'repuesto',
  'movimiento',
  'cliente_comercial',
  'cotizacion',
  'reserva',
  'venta',
  'prueba_manejo',
  'notificacion',
  'cita_taller',
  'reporte',
  'sistema',
];

/** Convierte un valor `date` (input) a ISO-8601 completo para la API. */
export function fechaAuditoriaAInput(valor: string, finDelDia = false): string | undefined {
  if (!valor) return undefined;
  const fecha = new Date(`${valor}T${finDelDia ? '23:59:59' : '00:00:00'}`);
  return fecha.toISOString();
}
