import type {
  CondicionVehiculo,
  EstadoVehiculo,
  TipoVehiculo,
  VehiculoFoto,
} from '@/types/vehiculo';

/** Vehículo publicado en el catálogo web (proyección pública, sin datos internos). */
export interface CatalogoVehiculo {
  vehiculoId: string;
  marca: string;
  modelo: string;
  anio: number;
  version: string;
  kilometraje: number;
  precio: number;
  color: string;
  condicion: CondicionVehiculo;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  descripcion: string;
  caracteristicas: string[];
  fotos: VehiculoFoto[];
  createdAt?: string;
}

export interface CatalogoResponse {
  total: number;
  vehiculos: CatalogoVehiculo[];
}

export interface CatalogoVehiculoResponse {
  vehiculo: CatalogoVehiculo;
}
