const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const ESTADOS_CITA = ['solicitada', 'confirmada', 'en_atencion', 'finalizada', 'cancelada'];

const TIPOS_SERVICIO = ['mantenimiento', 'reparacion', 'diagnostico', 'revision', 'otro'];

/** Horario de atención del taller configurado (hora local del servidor). */
const HORA_INICIO = 8;
const HORA_FIN = 18;

/** Granularidad de la agenda: las horas de inicio se redondean a este paso. */
const PASO_MINUTOS = 15;

const DURACION_DEFECTO = 60;
const DURACION_MIN = 15;
const DURACION_MAX = 480;

const fechaHoraSchema = z
  .string()
  .datetime({ message: 'La fecha y la hora no son válidas.' })
  .refine((valor) => new Date(valor) > new Date(), {
    message: 'La fecha y la hora deben ser futuras.',
  })
  .refine((valor) => {
    const fecha = new Date(valor);
    const minutos = fecha.getHours() * 60 + fecha.getMinutes();
    const desde = HORA_INICIO * 60;
    const hasta = HORA_FIN * 60;
    return minutos >= desde && minutos < hasta && minutos % PASO_MINUTOS === 0;
  }, {
    message: `El horario de atención es de ${String(HORA_INICIO).padStart(2, '0')}:00 a ${String(HORA_FIN).padStart(2, '0')}:00 y las citas se agendan de ${PASO_MINUTOS} en ${PASO_MINUTOS} minutos.`,
  });

const duracionSchema = z
  .number({ invalid_type_error: 'La duración debe ser un número de minutos.' })
  .int('La duración debe ser un número entero de minutos.')
  .min(DURACION_MIN, `La duración mínima es de ${DURACION_MIN} minutos.`)
  .max(DURACION_MAX, `La duración máxima es de ${DURACION_MAX} minutos.`);

const observacionesSchema = z
  .string()
  .trim()
  .max(1000, 'Las observaciones no pueden superar los 1000 caracteres.')
  .optional();

const createCitaTallerSchema = z.object({
  vehiculoId: z.string().trim().min(1, 'Selecciona un vehículo.'),
  clienteId: z.string().trim().min(1, 'Selecciona un cliente.'),
  tipoServicio: z.enum(TIPOS_SERVICIO, {
    errorMap: () => ({ message: `El tipo de servicio debe ser: ${TIPOS_SERVICIO.join(', ')}.` }),
  }),
  fechaHora: fechaHoraSchema,
  duracionMinutos: duracionSchema.optional(),
  observaciones: observacionesSchema,
});

const reprogramarCitaSchema = z.object({
  fechaHora: fechaHoraSchema,
  duracionMinutos: duracionSchema.optional(),
  observaciones: observacionesSchema,
});

const confirmarCitaSchema = z.object({
  observaciones: observacionesSchema,
});

const iniciarCitaSchema = z.object({
  observaciones: observacionesSchema,
});

const finalizarCitaSchema = z.object({
  observaciones: observacionesSchema,
});

const cancelarCitaSchema = z.object({
  motivo: z.string().trim().max(500, 'El motivo no puede superar los 500 caracteres.').optional(),
});

const listCitasQuerySchema = z
  .object({
    clienteId: z.string().trim().min(1).optional(),
    vehiculoId: z.string().trim().min(1).optional(),
    estado: z.enum(ESTADOS_CITA).optional(),
    fechaDesde: z.string().datetime({ message: 'La fecha inicial no es válida.' }).optional(),
    fechaHasta: z.string().datetime({ message: 'La fecha final no es válida.' }).optional(),
  })
  .refine((q) => !q.fechaDesde || !q.fechaHasta || q.fechaDesde <= q.fechaHasta, {
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

module.exports = {
  ESTADOS_CITA,
  TIPOS_SERVICIO,
  HORA_INICIO,
  HORA_FIN,
  PASO_MINUTOS,
  DURACION_DEFECTO,
  DURACION_MIN,
  DURACION_MAX,
  createCitaTallerSchema,
  reprogramarCitaSchema,
  confirmarCitaSchema,
  iniciarCitaSchema,
  finalizarCitaSchema,
  cancelarCitaSchema,
  listCitasQuerySchema,
  validate,
};
