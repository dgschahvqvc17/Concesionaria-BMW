const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

/**
 * Código de repuesto: alfanumérico en mayúsculas, admite punto, guion y
 * guion bajo. Se normaliza a mayúsculas antes de validar.
 */
const codigoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, 'El código debe tener al menos 2 caracteres.')
  .max(30, 'El código no puede superar 30 caracteres.')
  .regex(
    /^[A-Z0-9][A-Z0-9._-]*$/,
    'El código solo admite letras, números, punto, guion y guion bajo.'
  );

const repuestoBase = {
  codigo: codigoSchema,
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.').max(80, 'El nombre es demasiado largo.'),
  descripcion: z
    .string()
    .trim()
    .max(200, 'La descripción no puede superar los 200 caracteres.')
    .optional(),
  precio: z.coerce
    .number({ invalid_type_error: 'El precio es obligatorio.' })
    .positive('El precio debe ser mayor a 0.')
    .max(100000000, 'El precio supera el máximo permitido.'),
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .min(0, 'La cantidad no puede ser negativa.'),
  cantidadMinima: z.coerce
    .number({ invalid_type_error: 'La cantidad mínima debe ser un número.' })
    .int('La cantidad mínima debe ser un número entero.')
    .min(0, 'La cantidad mínima no puede ser negativa.')
    .optional(),
};

const createRepuestoSchema = z.object(repuestoBase);

/**
 * En la actualización no se permite modificar `cantidad`: las existencias solo
 * cambian mediante el registro de entradas y salidas (movimientos).
 */
const updateRepuestoSchema = z
  .object({
    codigo: repuestoBase.codigo.optional(),
    nombre: repuestoBase.nombre.optional(),
    descripcion: repuestoBase.descripcion,
    precio: repuestoBase.precio.optional(),
    cantidadMinima: repuestoBase.cantidadMinima,
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No se enviaron cambios para actualizar.' });

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

module.exports = { createRepuestoSchema, updateRepuestoSchema, validate };
