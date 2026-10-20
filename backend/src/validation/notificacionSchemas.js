const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const TIPOS_NOTIFICACION = ['reserva', 'cotizacion', 'prueba_manejo', 'venta'];
const ESTADOS_NOTIFICACION = ['pendiente', 'intentado', 'fallido', 'omitido'];

/** Intentos máximos por notificación antes de bloquear nuevos reenvíos. */
const MAX_INTENTOS = 5;

const listNotificacionesQuerySchema = z.object({
  tipo: z.enum(TIPOS_NOTIFICACION).optional(),
  estado: z.enum(ESTADOS_NOTIFICACION).optional(),
  recursoId: z.string().trim().min(1).optional(),
});

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;
}

module.exports = {
  TIPOS_NOTIFICACION,
  ESTADOS_NOTIFICACION,
  MAX_INTENTOS,
  listNotificacionesQuerySchema,
  validate,
};
