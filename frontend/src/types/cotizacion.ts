export type EstadoCotizacion = 'pendiente' | 'aceptada' | 'rechazada' | 'vencida';

/** Snapshot de un vehículo con el precio vigente al momento de cotizar. */
export interface CotizacionItem {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  vin?: string;
  precioUnitario: number;
  subtotal: number;
}

export interface CotizacionCliente {
  clienteId: string;
  nombres: string;
  apellidos: string;
  documento: string;
  email: string;
  telefono: string;
}

export interface Cotizacion {
  cotizacionId: string;
  numero: string;
  clienteId: string;
  cliente: CotizacionCliente;
  items: CotizacionItem[];
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoMonto: number;
  total: number;
  observaciones?: string;
  estado: EstadoCotizacion;
  vigenciaDias?: number;
  fechaVencimiento: string;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** `true` cuando el estado `vencida` se derivó de la fecha de vencimiento. */
  vencida?: boolean;
}

export interface CreateCotizacionInput {
  clienteId: string;
  vehiculoIds: string[];
  descuentoPorcentaje?: number;
  observaciones?: string;
  vigenciaDias?: number;
}

export interface UpdateCotizacionInput {
  descuentoPorcentaje?: number;
  observaciones?: string;
  estado?: EstadoCotizacion;
}

export interface CotizacionesResponse {
  total: number;
  cotizaciones: Cotizacion[];
}

export interface CotizacionResponse {
  message?: string;
  cotizacion: Cotizacion;
}
