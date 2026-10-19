import type { EstadoCotizacion } from '@/types/cotizacion';

export const ESTADOS_COTIZACION: EstadoCotizacion[] = ['pendiente', 'aceptada', 'rechazada', 'vencida'];

export const ESTADO_COTIZACION_LABELS: Record<EstadoCotizacion, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
};

/** Clases de color por estado (fondo suave + texto), alineadas a los primitivos. */
export const ESTADO_COTIZACION_STYLES: Record<EstadoCotizacion, string> = {
  pendiente: 'border-transparent bg-amber-500/10 text-amber-700',
  aceptada: 'border-transparent bg-emerald-500/10 text-emerald-700',
  rechazada: 'border-transparent bg-rose-500/10 text-rose-700',
  vencida: 'border-transparent bg-slate-500/10 text-slate-700',
};

/** Descuento máximo autorizado (misma política que valida el backend). */
export const DESCUENTO_MAXIMO = 20;

/** Días de vigencia por defecto de una cotización. */
export const VIGENCIA_DIAS_DEFECTO = 15;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Calcula el monto del descuento y el total a partir del subtotal. */
export function calcularImportes(subtotal: number, descuentoPorcentaje: number) {
  const descuentoMonto = redondear((subtotal * descuentoPorcentaje) / 100);
  return { descuentoMonto, total: redondear(subtotal - descuentoMonto) };
}

/** Una cotización solo puede modificarse mientras está pendiente. */
export function puedeModificarse(cotizacion: { estado: EstadoCotizacion }): boolean {
  return cotizacion.estado === 'pendiente';
}
