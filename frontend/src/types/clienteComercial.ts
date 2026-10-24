export type EstadoSeguimiento = 'nuevo' | 'contactado' | 'cotizando' | 'reservado' | 'vendido' | 'cerrado';

export interface ConsultaCliente {
  fecha: string;
  vehiculo?: string;
  interes: string;
  observacion?: string;
}

export interface ClienteComercial {
  clienteId: string;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  consultas?: ConsultaCliente[];
  notas?: string;
  estadoSeguimiento: EstadoSeguimiento;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClienteComercialInput {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  email: string;
  notas?: string;
  estadoSeguimiento?: EstadoSeguimiento;
}

export interface UpdateClienteComercialInput {
  nombres?: string;
  apellidos?: string;
  documento?: string;
  telefono?: string;
  email?: string;
  notas?: string;
  estadoSeguimiento?: EstadoSeguimiento;
}

export interface ClientesComercialesResponse {
  total: number;
  clientes: ClienteComercial[];
}

export interface ClienteComercialResponse {
  cliente: ClienteComercial;
}
