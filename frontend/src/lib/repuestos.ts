import type { TipoMovimiento } from '@/types/repuesto';

export const TIPOS_MOVIMIENTO: TipoMovimiento[] = ['entrada', 'salida'];

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimiento, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
};

/** Clases de color por tipo de movimiento (fondo suave + texto). */
export const TIPO_MOVIMIENTO_STYLES: Record<TipoMovimiento, string> = {
  entrada: 'border-transparent bg-emerald-500/10 text-emerald-700',
  salida: 'border-transparent bg-rose-500/10 text-rose-700',
};

/** Formatea un precio en formato de moneda (p. ej. $ 1.250). */
export function formatPrecio(precio: number): string {
  return `$ ${precio.toLocaleString('es-BO')}`;
}

/** Formatea una fecha ISO en formato corto local. */
export function formatFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}
