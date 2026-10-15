const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const TIPOS = ['entrada', 'salida'];

const createMovimientoSchema = z.object({
  repuestoId: z.string().trim().min(1, 'El repuesto es obligatorio.'),
  tipo: z.enum(TIPOS, { message: 'El tipo debe ser "entrada" o "salida".' }),
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser mayor a 0.'),
  motivo: z.string().trim().max(120, 'El motivo no puede superar 120 caracteres.').optional(),
});

/** Valida `data` contra un esquema zod y lanza ValidationError con el detalle por campo. */
function validate(schema, data) {
  const result = schema.safeParse(data ?? {});

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new ValidationError('Datos inválidos.', details);
  }

  return result.data;
}

module.exports = { TIPOS, createMovimientoSchema, validate };
