const { verifyIdToken } = require('./verify');
const { normalizeRoles } = require('./roles');

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
    return res.status(401).json({ error: 'Token de autenticación faltante.' });
  }

  try {
    const payload = await verifyIdToken(token);
    req.auth = payload;
    req.authRoles = normalizeRoles(payload['cognito:groups']);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
  }
}

/** Protege rutas por rol: requiere pertenecer a al menos uno de los roles indicados. */
function requireRole(...roles) {
  return (req, res, next) => {
    const userRoles = req.authRoles || [];
    const allowed = roles.some((role) => userRoles.includes(role));

    if (!allowed) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso.' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole, extractBearerToken };
