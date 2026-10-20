import type { Vehiculo } from '@/types/vehiculo';

/** Descuento máximo autorizado (misma política que valida el backend). */
export const DESCUENTO_MAXIMO = 20;

/** Unidades vendibles: disponibles o reservadas con una reserva vigente. */
export const ESTADOS_VENDIBLES = ['disponible', 'reservado'] as const;

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Calcula el monto del descuento y el precio final a partir del precio de lista. */
export function calcularImportes(precioLista: number, descuentoPorcentaje: number) {
  const descuentoMonto = redondear((precioLista * descuentoPorcentaje) / 100);
  return { descuentoMonto, precioFinal: redondear(precioLista - descuentoMonto) };
}

/** Indica si el vehículo puede entrar en una operación de venta (HU10). */
export function esVendible(vehiculo: Vehiculo): boolean {
  return ESTADOS_VENDIBLES.includes(vehiculo.estado as (typeof ESTADOS_VENDIBLES)[number]);
}

export function etiquetaEstadoVehiculo(vehiculo: Vehiculo): string {
  return vehiculo.estado === 'reservado' ? 'reservado (con reserva vigente)' : vehiculo.estado;
}
