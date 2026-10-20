const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

/** Descuento máximo autorizado por política comercial (misma que cotizaciones). */
const DESCUENTO_MAXIMO = 20;

const createVentaSchema = z.object({
  clienteId: z.string().trim().min(1, 'Selecciona un cliente.'),
  vehiculoId: z.string().trim().min(1, 'Selecciona un vehículo.'),
  descuentoPorcentaje: z
    .number({ invalid_type_error: 'El descuento debe ser un número.' })
    .min(0, 'El descuento no puede ser negativo.')
    .max(DESCUENTO_MAXIMO, `El descuento no puede superar el ${DESCUENTO_MAXIMO}%.`)
    .optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
  reservaId: z.string().trim().min(1).optional(),
  fechaVenta: z.string().datetime({ message: 'La fecha de venta no es válida.' }).optional(),
}).refine((d) => !d.fechaVenta || new Date(d.fechaVenta) <= new Date(), {
  message: 'La fecha de venta no puede ser futura.',
  path: ['fechaVenta'],
});

const listVentasQuerySchema = z.object({
  clienteId: z.string().trim().min(1).optional(),
  vehiculoId: z.string().trim().min(1).optional(),
});

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;
}

module.exports = { DESCUENTO_MAXIMO, createVentaSchema, listVentasQuerySchema, validate };
