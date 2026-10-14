/** Roles soportados por el sistema (coinciden con los Groups de Cognito). */
export const USER_ROLES = ['admin', 'vendedor', 'cliente'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Extrae los roles del claim `cognito:groups` del ID token.
 * Si el usuario no pertenece a ningún group conocido, queda como `cliente`.
 */
export function normalizeRoles(groups: unknown): UserRole[] {
  const list = Array.isArray(groups) ? groups : typeof groups === 'string' ? [groups] : [];
  const roles = list.filter(isUserRole);
  return roles.length > 0 ? roles : ['cliente'];
}

/** Devuelve el rol de mayor precedencia para mostrar en la UI. */
export function primaryRole(roles: UserRole[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('vendedor')) return 'vendedor';
  return 'cliente';
}
