import type { UserRole } from '@/lib/roles';

/** Identidad de marca centralizada (una sola fuente de verdad para textos y roles). */
export const APP_NAME = 'Concesionaria BMW';
export const APP_TAGLINE = 'Gestión de vehículos premium';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  jefe_taller: 'Jefe de Taller',
  mecanico: 'Mecánico',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Tienes acceso completo: gestión de usuarios, vehículos y reportes del sistema.',
  vendedor: 'Puedes gestionar vehículos, clientes y registrar ventas.',
  jefe_taller: 'Puedes supervisar el taller, asignar órdenes de trabajo y gestionar mecánicos.',
  mecanico: 'Puedes consultar y actualizar las órdenes de trabajo asignadas.',
};
