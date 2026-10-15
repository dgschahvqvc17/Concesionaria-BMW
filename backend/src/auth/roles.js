/** Roles del sistema (coinciden con los Groups de Cognito creados en CDK). */
const USER_ROLES = ['admin', 'vendedor', 'jefe_taller', 'mecanico', 'cliente'];

/** Roles internos (personal) gestionables por un administrador. Los clientes se autorregistran. */
const STAFF_ROLES = ['admin', 'vendedor', 'jefe_taller', 'mecanico'];

/** Rol por defecto cuando el usuario no tiene un group válido asignado. */
const DEFAULT_ROLE = 'mecanico';

function isUserRole(value) {
  return typeof value === 'string' && USER_ROLES.includes(value);
}

/** Devuelve los roles válidos del claim `cognito:groups` del ID token. */
function normalizeRoles(groups) {
  const list = Array.isArray(groups) ? groups : typeof groups === 'string' ? [groups] : [];
  const roles = list.filter(isUserRole);
  return roles.length > 0 ? roles : [DEFAULT_ROLE];
}

/** Rol de mayor precedencia según el orden de USER_ROLES. */
function primaryRole(roles) {
  return USER_ROLES.find((role) => roles.includes(role)) ?? DEFAULT_ROLE;
}

module.exports = { USER_ROLES, STAFF_ROLES, DEFAULT_ROLE, isUserRole, normalizeRoles, primaryRole };
