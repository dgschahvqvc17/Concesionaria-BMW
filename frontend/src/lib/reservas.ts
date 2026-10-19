import type { EstadoReserva } from '@/types/reserva';

export const ESTADOS_RESERVA: EstadoReserva[] = ['activa', 'cancelada', 'vencida', 'convertida'];

export const ESTADO_RESERVA_LABELS: Record<EstadoReserva, string> = {
  activa: 'Activa',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
  convertida: 'Convertida en venta',
};

/** Clases de color por estado (fondo suave + texto), alineadas a los primitivos. */
export const ESTADO_RESERVA_STYLES: Record<EstadoReserva, string> = {
  activa: 'border-transparent bg-emerald-500/10 text-emerald-700',
  cancelada: 'border-transparent bg-rose-500/10 text-rose-700',
  vencida: 'border-transparent bg-slate-500/10 text-slate-700',
  convertida: 'border-transparent bg-brand-blue/10 text-brand-blue',
};

/** Días de vigencia por defecto de una reserva (misma política que el backend). */
export const VIGENCIA_DIAS_DEFECTO = 30;

/** Días de vigencia máximos aceptados por el formulario de reserva. */
export const VIGENCIA_DIAS_MAX = 365;

/** Solo las reservas activas pueden cancelarse o convertirse en venta. */
export function puedeGestionarse(reserva: { estado: EstadoReserva }): boolean {
  return reserva.estado === 'activa';
}
