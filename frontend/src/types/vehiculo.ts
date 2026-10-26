export type CondicionVehiculo = 'nuevo' | 'seminuevo';

export type EstadoVehiculo = 'disponible' | 'reservado' | 'vendido' | 'no_disponible';

export type TipoVehiculo =
  | 'sedan'
  | 'suv'
  | 'coupe'
  | 'cabrio'
  | 'touring'
  | 'hatchback'
  | 'deportivo'
  | 'otros';

export type CategoriaArchivo = 'foto' | 'documento';

export interface VehiculoFoto {
  key: string;
  url: string;
}

/** Documento asociado a un vehículo (HU06). */
export interface VehiculoDocumento {
  key: string;
  nombre: string;
  contentType?: string;
  size?: number;
  /** URL prefirmada de lectura (solo disponible en documentos ya guardados). */
  url?: string;
}

export interface Vehiculo {
  vehiculoId: string;
  vin: string;
  marca: string;
  modelo: string;
  anio: number;
  version: string;
  kilometraje: number;
  /** Unidades disponibles para la venta. Entero mayor o igual a cero. */
  stock: number;
  precio: number;
  color: string;
  condicion: CondicionVehiculo;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  descripcion?: string;
  caracteristicas?: string[];
  /** Si es `false`, el vehículo no se publica en el catálogo web. */
  publicado?: boolean;
  fotos: VehiculoFoto[];
  documentos?: VehiculoDocumento[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiculoInput {
  marca: string;
  modelo: string;
  anio: number;
  version: string;
  kilometraje: number;
  stock: number;
  precio: number;
  color: string;
  vin: string;
  condicion: CondicionVehiculo;
  tipo: TipoVehiculo;
  estado?: EstadoVehiculo;
  descripcion?: string;
  caracteristicas?: string[];
  publicado?: boolean;
  /** Claves de las fotografías ya subidas a S3. */
  fotos?: string[];
  /** Documentos (key + nombre) ya subidos a S3. */
  documentos?: VehiculoDocumento[];
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

export interface PresignArchivoInput {
  categoria: CategoriaArchivo;
  contentType: string;
  nombre: string;
  size: number;
}

export interface PresignArchivoResponse {
  key: string;
  uploadUrl: string;
  maxSize: number;
}
