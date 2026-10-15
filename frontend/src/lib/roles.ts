/** Roles soportados por el sistema (coinciden con los Groups de Cognito). */
export const USER_ROLES = ['admin', 'vendedor', 'jefe_taller', 'mecanico'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_ROLE: UserRole = 'mecanico';

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Extrae los roles del claim `cognito:groups` del ID token.
 * Si el usuario no pertenece a ningún group conocido, queda con el rol por defecto.
 */
export function normalizeRoles(groups: unknown): UserRole[] {
  const list = Array.isArray(groups) ? groups : typeof groups === 'string' ? [groups] : [];
  const roles = list.filter(isUserRole);
  return roles.length > 0 ? roles : [DEFAULT_ROLE];
}

/** Devuelve el rol de mayor precedencia para mostrar en la UI. */
export function primaryRole(roles: UserRole[]): UserRole {
  return USER_ROLES.find((role) => roles.includes(role)) ?? DEFAULT_ROLE;
}
