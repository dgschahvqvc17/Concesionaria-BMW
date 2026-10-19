const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const ESTADOS_COTIZACION = ['pendiente', 'aceptada', 'rechazada', 'vencida'];

/** Descuento máximo autorizado para una cotización (política comercial). */
const DESCUENTO_MAXIMO = 20;

const createCotizacionSchema = z.object({
  clienteId: z.string().trim().min(1, 'Selecciona un cliente.'),
  vehiculoIds: z
    .array(z.string().trim().min(1))
    .min(1, 'Selecciona al menos un vehículo.')
    .max(20, 'No puedes cotizar más de 20 vehículos a la vez.'),
  descuentoPorcentaje: z
    .number({ invalid_type_error: 'El descuento debe ser un número.' })
    .min(0, 'El descuento no puede ser negativo.')
    .max(DESCUENTO_MAXIMO, `El descuento no puede superar el ${DESCUENTO_MAXIMO}%.`)
    .optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
  vigenciaDias: z
    .number({ invalid_type_error: 'La vigencia debe ser un número.' })
    .int('La vigencia debe ser un número entero de días.')
    .min(1, 'La vigencia mínima es de 1 día.')
    .max(90, 'La vigencia máxima es de 90 días.')
    .optional(),
});

const updateCotizacionSchema = z
  .object({
    descuentoPorcentaje: z
      .number({ invalid_type_error: 'El descuento debe ser un número.' })
      .min(0, 'El descuento no puede ser negativo.')
      .max(DESCUENTO_MAXIMO, `El descuento no puede superar el ${DESCUENTO_MAXIMO}%.`)
      .optional(),
    observaciones: z.string().trim().max(1000).optional(),
    estado: z.enum(ESTADOS_COTIZACION).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No se enviaron cambios para actualizar.' });

const listCotizacionesQuerySchema = z.object({
  clienteId: z.string().trim().min(1).optional(),
  estado: z.enum(ESTADOS_COTIZACION).optional(),
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
  ESTADOS_COTIZACION,
  DESCUENTO_MAXIMO,
  createCotizacionSchema,
  updateCotizacionSchema,
  listCotizacionesQuerySchema,
  validate,
};
