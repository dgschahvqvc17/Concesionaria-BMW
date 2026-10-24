const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const TIPOS_OPERACION = ['auth', 'usuario', 'vehiculo', 'repuesto', 'movimiento', 'cliente_comercial', 'cotizacion', 'reserva', 'venta', 'prueba_manejo', 'notificacion', 'cita_taller', 'reporte', 'sistema'];

const listAuditoriaQuerySchema = z.object({
  usuarioId: z.string().optional(),
  tipo: z.enum(TIPOS_OPERACION).optional(),
  recursoTipo: z.string().max(50).optional(),
  recursoId: z.string().max(100).optional(),
  fechaDesde: z.string().datetime({ message: 'La fechaDesde no es válida.' }).optional(),
  fechaHasta: z.string().datetime({ message: 'La fechaHasta no es válida.' }).optional(),
}).refine((q) => !q.fechaDesde || !q.fechaHasta || q.fechaDesde <= q.fechaHasta, {
  message: 'El rango de fechas no es válido (fechaDesde debe ser anterior a fechaHasta).',
  path: ['fechaHasta'],
});

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;
}

module.exports = { TIPOS_OPERACION, listAuditoriaQuerySchema, validate };
