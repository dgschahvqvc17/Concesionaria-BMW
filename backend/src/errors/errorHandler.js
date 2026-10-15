const { AppError, ConflictError, NotFoundError } = require('./AppError');

/** 404 para rutas no registradas. */
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' });
}

/** Traduce errores de AWS Cognito a errores de aplicación. */
function mapAwsError(err) {
  switch (err.name) {
    case 'UsernameExistsException':
    case 'AliasExistsException':
      return new ConflictError('El correo electrónico ya está registrado.');
    case 'UserNotFoundException':
      return new NotFoundError('Usuario no encontrado.');
    case 'InvalidPasswordException':
      return new AppError('La contraseña no cumple con los requisitos de seguridad.', 400, 'VALIDATION_ERROR');
    case 'ResourceNotFoundException':
      return new AppError('No se encontró el User Pool configurado.', 500, 'CONFIG_ERROR');
    default:
      return null;
  }
}

/** Manejador central de errores (Express). */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code };
    if (err.details) body.details = err.details;
    return res.status(err.statusCode).json(body);
  }

  const mapped = mapAwsError(err);
  if (mapped) {
    const body = { error: mapped.message, code: mapped.code };
    return res.status(mapped.statusCode).json(body);
  }

  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'Ocurrió un error interno en el servidor.', code: 'INTERNAL_ERROR' });
}

module.exports = { notFoundHandler, errorHandler };
