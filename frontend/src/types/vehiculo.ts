export type CondicionVehiculo = 'nuevo' | 'seminuevo';

export type EstadoVehiculo = 'disponible' | 'reservado' | 'vendido' | 'no_disponible';

export interface VehiculoFoto {
  key: string;
  url: string;
}

export interface Vehiculo {
  vehiculoId: string;
  vin: string;
  marca: string;
  modelo: string;
  anio: number;
  version: string;
  kilometraje: number;
  precio: number;
  color: string;
  condicion: CondicionVehiculo;
  estado: EstadoVehiculo;
  fotos: VehiculoFoto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiculoInput {
  marca: string;
  modelo: string;
  anio: number;
  version: string;
  kilometraje: number;
  precio: number;
  color: string;
  vin: string;
  condicion: CondicionVehiculo;
  estado?: EstadoVehiculo;
  /** Claves de las fotografías ya subidas a S3. */
  fotos?: string[];
}

export type UpdateVehiculoInput = Partial<CreateVehiculoInput>;

export interface VehiculosResponse {
  total: number;
  vehiculos: Vehiculo[];
}

export interface VehiculoResponse {
  message?: string;
  vehiculo: Vehiculo;
}

export interface PresignFotoResponse {
  key: string;
  uploadUrl: string;
}
