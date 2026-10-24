export type EstadoReserva = 'activa' | 'cancelada' | 'vencida' | 'convertida';

/** Snapshot del cliente al momento de reservar. */
export interface ReservaCliente {
  clienteId: string;
  nombres: string;
  apellidos: string;
  documento: string;
  email: string;
  telefono: string;
}

/** Snapshot del vehículo reservado con su precio vigente. */
export interface ReservaVehiculo {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  vin?: string;
  precio: number;
}

/** Entrada del historial de estados de una reserva. */
export interface ReservaHistorial {
  estado: EstadoReserva;
  fecha: string;
  usuario?: string | null;
  motivo?: string;
}

export interface Reserva {
  reservaId: string;
  numero: string;
  clienteId: string;
  cliente: ReservaCliente;
  vehiculoId: string;
  vehiculo: ReservaVehiculo;
  condiciones?: string;
  monto?: number;
  estado: EstadoReserva;
  vigenciaDias?: number;
  fechaVencimiento: string;
  observaciones?: string;
  historial?: ReservaHistorial[];
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservaInput {
  clienteId: string;
  vehiculoId: string;
  condiciones?: string;
  monto?: number;
  vigenciaDias?: number;
  fechaVencimiento?: string;
}

export interface CancelarReservaInput {
  motivo?: string;
}

export interface ConvertirReservaInput {
  observaciones?: string;
}

export interface ReservasResponse {
  total: number;
  reservas: Reserva[];
}

export interface ReservaResponse {
  message?: string;
  reserva: Reserva;
}
