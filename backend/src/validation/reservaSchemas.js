const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const ESTADOS_RESERVA = ['activa', 'cancelada', 'vencida', 'convertida'];

/** Días de vigencia por defecto de una reserva (HU09). */
const VIGENCIA_DIAS_DEFECTO = 30;

/** Días que exige el formulario de reserva. */
const VIGENCIA_DIAS_MIN = 1;
const VIGENCIA_DIAS_MAX = 365;

const createReservaSchema = z
  .object({
    clienteId: z.string().trim().min(1, 'Selecciona un cliente.'),
    vehiculoId: z.string().trim().min(1, 'Selecciona un vehículo.'),
    condiciones: z.string().trim().max(1000, 'Las condiciones no pueden superar los 1000 caracteres.').optional(),
    monto: z
      .number({ invalid_type_error: 'El monto de la reserva debe ser un número.' })
      .min(0, 'El monto no puede ser negativo.')
      .optional(),
    vigenciaDias: z
      .number({ invalid_type_error: 'La vigencia debe ser un número.' })
      .int('La vigencia debe ser un número entero de días.')
      .min(VIGENCIA_DIAS_MIN, 'La vigencia mínima es de 1 día.')
      .max(VIGENCIA_DIAS_MAX, `La vigencia máxima es de ${VIGENCIA_DIAS_MAX} días.`)
      .optional(),
    fechaVencimiento: z.string().datetime({ message: 'La fecha de vencimiento no es válida.' }).optional(),
  })
  .refine((d) => !d.fechaVencimiento || new Date(d.fechaVencimiento) > new Date(), {
    message: 'La fecha de vencimiento debe ser posterior a hoy.',
    path: ['fechaVencimiento'],
  });

const cancelarReservaSchema = z.object({
  motivo: z.string().trim().max(500, 'El motivo no puede superar los 500 caracteres.').optional(),
});

const convertirReservaSchema = z.object({
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
});

const listReservasQuerySchema = z.object({
  clienteId: z.string().trim().min(1).optional(),
  vehiculoId: z.string().trim().min(1).optional(),
  estado: z.enum(ESTADOS_RESERVA).optional(),
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
  ESTADOS_RESERVA,
  VIGENCIA_DIAS_DEFECTO,
  VIGENCIA_DIAS_MIN,
  VIGENCIA_DIAS_MAX,
  createReservaSchema,
  cancelarReservaSchema,
  convertirReservaSchema,
  listReservasQuerySchema,
  validate,
};
