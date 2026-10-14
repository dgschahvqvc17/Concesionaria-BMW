import type { UserRole } from '@/lib/roles';

/** Identidad de marca centralizada (una sola fuente de verdad para textos y roles). */
export const APP_NAME = 'Concesionaria BMW';
export const APP_TAGLINE = 'Gestión de vehículos premium';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  cliente: 'Cliente',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Tienes acceso completo: gestión de usuarios, vehículos y reportes del sistema.',
  vendedor: 'Puedes gestionar vehículos, clientes y registrar ventas.',
  cliente: 'Puedes consultar el catálogo de vehículos y el estado de tus compras.',
};
