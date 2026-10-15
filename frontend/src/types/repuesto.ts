export type TipoMovimiento = 'entrada' | 'salida';

export interface Repuesto {
  repuestoId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  cantidadMinima: number;
  requiereReposicion: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRepuestoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  cantidad: number;
  cantidadMinima?: number;
}

/** La cantidad no se edita: las existencias cambian solo con movimientos. */
export interface UpdateRepuestoInput {
  codigo?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  cantidadMinima?: number;
}

export interface RepuestosResponse {
  total: number;
  repuestos: Repuesto[];
}

export interface RepuestoResponse {
  message?: string;
  repuesto: Repuesto;
}

export interface Movimiento {
  movimientoId: string;
  repuestoId: string;
  repuestoCodigo: string;
  repuestoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  cantidadResultante: number;
  motivo: string;
  createdAt?: string;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
}

export interface CreateMovimientoInput {
  repuestoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}

export interface MovimientosResponse {
  total: number;
  movimientos: Movimiento[];
}

export interface MovimientoResponse {
  message?: string;
  movimiento: Movimiento;
  repuesto: Repuesto;
}
