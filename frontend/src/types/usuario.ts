import type { UserRole } from '@/lib/roles';

export type EstadoUsuario = 'activo' | 'inactivo';

export interface Usuario {
  userId: string;
  email: string;
  nombre: string;
  rol: UserRole;
  estado: EstadoUsuario;
  fechaNacimiento?: string;
  carnetIdentidad?: string;
  celular?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUsuarioInput {
  nombre: string;
  email: string;
  rol: UserRole;
  password: string;
}

export interface UpdateUsuarioInput {
  nombre?: string;
  rol?: UserRole;
  estado?: EstadoUsuario;
}

export interface UsuariosResponse {
  total: number;
  usuarios: Usuario[];
}

export interface UsuarioResponse {
  message?: string;
  usuario: Usuario;
}

/** Datos del autorregistro público de clientes. */
export interface RegistroClienteInput {
  nombre: string;
  email: string;
  password: string;
  fechaNacimiento: string;
  carnetIdentidad: string;
  celular: string;
}
