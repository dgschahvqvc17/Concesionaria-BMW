const { verifyIdToken } = require('./verify');
const { normalizeRoles } = require('./roles');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

/** Extrae el token del header `Authorization: Bearer <token>`. */
function extractBearerToken(header) {
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/** Protege rutas: exige un ID token de Cognito válido. */
async function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new UnauthorizedError('Token de autenticación faltante.'));
  }

  try {
    const payload = await verifyIdToken(token);
    req.auth = payload;
    req.authRoles = normalizeRoles(payload['cognito:groups']);
    return next();
  } catch {
    return next(new UnauthorizedError('Token inválido o expirado. Vuelve a iniciar sesión.'));
  }
}

/** Protege rutas por rol: requiere pertenecer a al menos uno de los roles indicados. */
function requireRole(...roles) {
  return (req, res, next) => {
    const userRoles = req.authRoles || [];
    const allowed = roles.some((role) => userRoles.includes(role));

    if (!allowed) {
      return next(new ForbiddenError('No tienes permisos para realizar esta acción.'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole, extractBearerToken };
