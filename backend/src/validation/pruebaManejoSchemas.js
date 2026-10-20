const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const ESTADOS_PRUEBA = ['pendiente', 'confirmada', 'realizada', 'cancelada'];

/** Ventana de atención en la que se pueden agendar pruebas (hora local del servidor). */
const HORA_INICIO = 8;
const HORA_FIN = 18;

/** Granularidad de la agenda: las horas de inicio se redondean a este paso. */
const PASO_MINUTOS = 15;

const DURACION_DEFECTO = 60;
const DURACION_MIN = 15;
const DURACION_MAX = 180;

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
    message: `El horario de atención es de ${String(HORA_INICIO).padStart(2, '0')}:00 a ${String(HORA_FIN).padStart(2, '0')}:00 y las horas se agendan de ${PASO_MINUTOS} en ${PASO_MINUTOS} minutos.`,
  });

const duracionSchema = z
  .number({ invalid_type_error: 'La duración debe ser un número de minutos.' })
  .int('La duración debe ser un número entero de minutos.')
  .min(DURACION_MIN, `La duración mínima es de ${DURACION_MIN} minutos.`)
  .max(DURACION_MAX, `La duración máxima es de ${DURACION_MAX} minutos.`);

const contactoSchema = z.object({
  nombre: z.string().trim().min(2, 'Indica el nombre del solicitante.').max(120, 'El nombre no puede superar los 120 caracteres.'),
  telefono: z.string().trim().min(6, 'Indica un teléfono de contacto válido.').max(30, 'El teléfono no puede superar los 30 caracteres.'),
  email: z.string().trim().email('El correo de contacto no es válido.').max(160, 'El correo no puede superar los 160 caracteres.').optional(),
});

const createPruebaManejoSchema = z.object({
  vehiculoId: z.string().trim().min(1, 'Selecciona un vehículo.'),
  clienteId: z.string().trim().min(1).optional(),
  contacto: contactoSchema,
  fechaHora: fechaHoraSchema,
  duracionMinutos: duracionSchema.optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
});

const reprogramarPruebaSchema = z.object({
  fechaHora: fechaHoraSchema,
  duracionMinutos: duracionSchema.optional(),
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
});

const confirmarPruebaSchema = z.object({
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
});

const cancelarPruebaSchema = z.object({
  motivo: z.string().trim().max(500, 'El motivo no puede superar los 500 caracteres.').optional(),
});

const realizarPruebaSchema = z.object({
  observaciones: z.string().trim().max(1000, 'Las observaciones no pueden superar los 1000 caracteres.').optional(),
});

const listPruebasQuerySchema = z.object({
  clienteId: z.string().trim().min(1).optional(),
  vehiculoId: z.string().trim().min(1).optional(),
  estado: z.enum(ESTADOS_PRUEBA).optional(),
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
  ESTADOS_PRUEBA,
  HORA_INICIO,
  HORA_FIN,
  PASO_MINUTOS,
  DURACION_DEFECTO,
  DURACION_MIN,
  DURACION_MAX,
  createPruebaManejoSchema,
  reprogramarPruebaSchema,
  confirmarPruebaSchema,
  cancelarPruebaSchema,
  realizarPruebaSchema,
  listPruebasQuerySchema,
  validate,
};
