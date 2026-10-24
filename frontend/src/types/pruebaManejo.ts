export type EstadoPrueba = 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';

export type OrigenPrueba = 'catalogo' | 'cliente' | 'interno';

/** Datos de contacto del solicitante (cliente final o visita del catálogo). */
export interface PruebaContacto {
  nombre: string;
  telefono: string;
  email?: string;
}

/** Snapshot del vehículo elegido para la prueba. */
export interface PruebaVehiculo {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  precio: number;
  color?: string;
}

/** Snapshot del cliente comercial vinculado (cuando lo hay). */
export interface PruebaCliente {
  clienteId: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export interface PruebaHistorial {
  estado: EstadoPrueba;
  fecha: string;
  usuario?: string | null;
  motivo?: string;
  observaciones?: string;
}

export interface PruebaManejo {
  pruebaId: string;
  numero: string;
  vehiculoId: string;
  vehiculo: PruebaVehiculo;
  clienteId: string;
  cliente: PruebaCliente | null;
  contacto: PruebaContacto;
  fechaHora: string;
  duracionMinutos: number;
  estado: EstadoPrueba;
  origen: OrigenPrueba;
  observaciones?: string;
  historial?: PruebaHistorial[];
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePruebaManejoInput {
  vehiculoId: string;
  clienteId?: string;
  contacto: PruebaContacto;
  fechaHora: string;
  duracionMinutos?: number;
  observaciones?: string;
}

export interface ReprogramarPruebaInput {
  fechaHora: string;
  duracionMinutos?: number;
  observaciones?: string;
}

export interface ConfirmarPruebaInput {
  observaciones?: string;
}

export interface CancelarPruebaInput {
  motivo?: string;
}

export interface RealizarPruebaInput {
  observaciones?: string;
}

export interface PruebasResponse {
  total: number;
  pruebas: PruebaManejo[];
}

export interface PruebaResponse {
  message?: string;
  prueba: PruebaManejo;
}
