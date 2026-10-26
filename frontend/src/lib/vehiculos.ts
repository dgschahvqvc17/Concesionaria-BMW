import type { CondicionVehiculo, EstadoVehiculo, TipoVehiculo } from '@/types/vehiculo';

export const CONDICIONES: CondicionVehiculo[] = ['nuevo', 'seminuevo'];

export const ESTADOS: EstadoVehiculo[] = ['disponible', 'reservado', 'vendido', 'no_disponible'];

export const TIPOS: TipoVehiculo[] = [
  'sedan',
  'suv',
  'coupe',
  'cabrio',
  'touring',
  'hatchback',
  'deportivo',
  'otros',
];

export const CONDICION_LABELS: Record<CondicionVehiculo, string> = {
  nuevo: 'Nuevo',
  seminuevo: 'Seminuevo',
};

export const TIPO_LABELS: Record<TipoVehiculo, string> = {
  sedan: 'Sedán',
  suv: 'SUV',
  coupe: 'Coupé',
  cabrio: 'Cabrio',
  touring: 'Touring',
  hatchback: 'Hatchback',
  deportivo: 'Deportivo',
  otros: 'Otros',
};

export const ESTADO_LABELS: Record<EstadoVehiculo, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
  no_disponible: 'No disponible',
};

/** Clases de color por estado (fondo suave + texto). */
export const ESTADO_STYLES: Record<EstadoVehiculo, string> = {
  disponible: 'border-transparent bg-emerald-500/10 text-emerald-700',
  reservado: 'border-transparent bg-amber-500/10 text-amber-700',
  vendido: 'border-transparent bg-brand-blue/10 text-brand-blue-deep',
  no_disponible: 'border-transparent bg-zinc-500/10 text-zinc-600',
};

/** Clases de badge para estados sobre fotografías (fondo opaco + texto blanco). */
export const ESTADO_STYLES_FOTO: Record<EstadoVehiculo, string> = {
  disponible: 'border-transparent bg-emerald-700 text-white',
  reservado: 'border-transparent bg-amber-700 text-white',
  vendido: 'border-transparent bg-brand-blue-deep text-white',
  no_disponible: 'border-transparent bg-zinc-700 text-white',
};

/**
 * Nivel de stock de un vehículo. Se considera stock bajo cuando queda una sola
 * unidad disponible; el negocio puede ajustar el umbral en este único lugar.
 */
export type NivelStock = 'sin_stock' | 'bajo' | 'disponible';

export const STOCK_BAJO_VEHICULO = 1;

export function nivelStock(stock: number): NivelStock {
  if (!Number.isFinite(stock) || stock <= 0) return 'sin_stock';
  if (stock <= STOCK_BAJO_VEHICULO) return 'bajo';
  return 'disponible';
}

export const NIVEL_STOCK_LABELS: Record<NivelStock, string> = {
  sin_stock: 'Sin stock',
  bajo: 'Stock bajo',
  disponible: 'Disponible',
};

export const NIVEL_STOCK_STYLES: Record<NivelStock, string> = {
  sin_stock: 'border-transparent bg-rose-500/10 text-rose-700',
  bajo: 'border-transparent bg-amber-500/10 text-amber-700',
  disponible: 'border-transparent bg-emerald-500/10 text-emerald-700',
};

/** Formatea una cantidad de stock (p. ej. 1.250). */
export function formatStock(stock: number): string {
  return stock.toLocaleString('es-BO');
}

/** Formatea un precio en formato de moneda (p. ej. $ 82.000). */
export function formatPrecio(precio: number): string {
  return `$ ${precio.toLocaleString('es-BO')}`;
}

/** Formatea el kilometraje (p. ej. 12.500 km). */
export function formatKilometraje(km: number): string {
  return `${km.toLocaleString('es-BO')} km`;
}

/** Formatea una fecha ISO en formato corto local. */
export function formatFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
}
