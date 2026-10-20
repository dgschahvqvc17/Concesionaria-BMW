/** Snapshot del cliente al momento de registrar la venta (HU10). */
export interface VentaCliente {
  clienteId: string;
  nombres: string;
  apellidos: string;
  documento: string;
  email: string;
  telefono: string;
}

/** Snapshot del vehículo con su precio vigente al momento de vender (HU10). */
export interface VentaVehiculo {
  vehiculoId: string;
  marca: string;
  modelo: string;
  version: string;
  anio: number;
  vin?: string;
  precio: number;
}

export interface Venta {
  ventaId: string;
  numero: string;
  clienteId: string;
  cliente: VentaCliente;
  vehiculoId: string;
  vehiculo: VentaVehiculo;
  reservaId?: string | null;
  numeroReserva?: string | null;
  precioLista: number;
  descuentoPorcentaje: number;
  descuentoMonto: number;
  precioFinal: number;
  observaciones?: string;
  fechaVenta: string;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVentaInput {
  clienteId: string;
  vehiculoId: string;
  descuentoPorcentaje?: number;
  observaciones?: string;
  reservaId?: string;
  fechaVenta?: string;
}

export interface VentasResponse {
  total: number;
  ventas: Venta[];
}

export interface VentaResponse {
  message?: string;
  venta: Venta;
}
