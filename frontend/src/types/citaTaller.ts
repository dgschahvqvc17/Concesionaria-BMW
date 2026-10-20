export type EstadoCita = 'solicitada' | 'confirmada' | 'en_atencion' | 'finalizada' | 'cancelada';

export type TipoServicioCita = 'mantenimiento' | 'reparacion' | 'diagnostico' | 'revision' | 'otro';

/** Snapshot del vehículo que requiere atención. */
export interface CitaVehiculo {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  precio: number;
  color?: string;
}

/** Snapshot del cliente comercial vinculado. */
export interface CitaCliente {
  clienteId: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export interface CitaHistorial {
  estado: EstadoCita;
  fecha: string;
  usuario?: string | null;
  motivo?: string;
  observaciones?: string;
}

/** Snapshot del mecánico responsable (HU14). */
export interface CitaMecanico {
  userId: string;
  nombre: string;
  email: string;
}

export type TipoAsignacionCita = 'asignada' | 'reasignada';

/** Entrada del historial de cambios de asignación (HU14). */
export interface CitaAsignacion {
  mecanicoId: string;
  mecanicoNombre?: string;
  tipo: TipoAsignacionCita;
  fecha: string;
  usuario?: string | null;
  observaciones?: string;
}

export interface CitaTaller {
  citaId: string;
  numero: string;
  vehiculoId: string;
  vehiculo: CitaVehiculo;
  clienteId: string;
  cliente: CitaCliente | null;
  tipoServicio: TipoServicioCita;
  fechaHora: string;
  duracionMinutos: number;
  estado: EstadoCita;
  mecanicoId?: string | null;
  mecanico?: CitaMecanico | null;
  asignadoAt?: string | null;
  asignaciones?: CitaAsignacion[];
  observaciones?: string;
  historial?: CitaHistorial[];
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Mecánico disponible para asignar (HU14). */
export interface Mecanico {
  userId: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
}

export interface MecanicosResponse {
  total: number;
  mecanicos: Mecanico[];
}

export interface CreateCitaTallerInput {
  vehiculoId: string;
  clienteId: string;
  tipoServicio: TipoServicioCita;
  fechaHora: string;
  duracionMinutos?: number;
  observaciones?: string;
}

export interface ReprogramarCitaInput {
  fechaHora: string;
  duracionMinutos?: number;
  observaciones?: string;
}

export interface EstadoCitaInput {
  observaciones?: string;
}

export interface CancelarCitaInput {
  motivo?: string;
}

export interface AsignarCitaInput {
  mecanicoId: string;
  observaciones?: string;
}

export interface CitasResponse {
  total: number;
  citas: CitaTaller[];
}

export interface CitaResponse {
  message?: string;
  cita: CitaTaller;
}
