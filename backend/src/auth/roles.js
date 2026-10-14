/** Roles del sistema (coinciden con los Groups de Cognito creados en CDK). */
const USER_ROLES = ['admin', 'vendedor', 'cliente'];

function isUserRole(value) {
  return typeof value === 'string' && USER_ROLES.includes(value);
}

/** Devuelve los roles del claim `cognito:groups` del ID token. */
function normalizeRoles(groups) {
  const list = Array.isArray(groups) ? groups : typeof groups === 'string' ? [groups] : [];
  const roles = list.filter(isUserRole);
  return roles.length > 0 ? roles : ['cliente'];
}

/** Rol de mayor precedencia. */
function primaryRole(roles) {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('vendedor')) return 'vendedor';
  return 'cliente';
}

module.exports = { USER_ROLES, isUserRole, normalizeRoles, primaryRole };
