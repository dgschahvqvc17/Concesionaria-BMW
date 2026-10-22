const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

/** Tipos de reporte disponibles (HU17). */
const TIPOS_REPORTE = ['inventario', 'ventas', 'clientes', 'taller', 'repuestos'];

/** Reportes que agregan por período y aceptan filtro de fechas (HU17). */
const TIPOS_CON_FECHAS = ['ventas', 'taller'];

const fechaSchema = z
  .string()
  .datetime({ message: 'La fecha no es válida.' })
  .optional();

const listReporteQuerySchema = z
  .object({
    fechaDesde: fechaSchema,
    fechaHasta: fechaSchema,
  })
  .refine((q) => !q.fechaDesde || !q.fechaHasta || q.fechaDesde <= q.fechaHasta, {
    message: 'El rango de fechas no es válido (fechaDesde debe ser anterior a fechaHasta).',
    path: ['fechaHasta'],
  });

const tipoReporteParamSchema = z.object({
  tipo: z.enum(TIPOS_REPORTE, {
    message: `El tipo de reporte debe ser: ${TIPOS_REPORTE.join(', ')}.`,
  }),
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
  TIPOS_REPORTE,
  TIPOS_CON_FECHAS,
  listReporteQuerySchema,
  tipoReporteParamSchema,
  validate,
};
