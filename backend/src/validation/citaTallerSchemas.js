const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');
const { CATEGORIAS_ARCHIVO } = require('../services/storageService');

const ESTADOS_CITA = ['solicitada', 'confirmada', 'en_atencion', 'finalizada', 'cancelada'];

const TIPOS_SERVICIO = ['mantenimiento', 'reparacion', 'diagnostico', 'revision', 'otro'];

/** Estados del trabajo en los que el mecánico puede documentar avances (HU15). */
const ESTADOS_CITA_AVANCE = ['confirmada', 'en_atencion'];

/** Categorías de archivo técnico admitidas en la orden de trabajo (HU15). */
const CATEGORIAS_ARCHIVO_TALLER = ['taller_foto', 'taller_documento'];

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

const asignarCitaSchema = z.object({
  mecanicoId: z.string().trim().min(1, 'Selecciona un mecánico.'),
  observaciones: observacionesSchema,
});

const tareaAvanceSchema = z.object({
  descripcion: z.string().trim().min(1, 'Describe la tarea realizada.').max(500, 'Máximo 500 caracteres.'),
  realizada: z.boolean().optional(),
});

const repuestoUtilizadoSchema = z.object({
  repuestoId: z.string().trim().min(1, 'El repuesto es obligatorio.'),
  cantidad: z.coerce
    .number({ invalid_type_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .positive('La cantidad debe ser mayor a 0.'),
});

const archivoTallerSchema = z.object({
  key: z.string().trim().min(1, 'La clave del archivo es obligatoria.'),
  nombre: z.string().trim().min(1, 'El nombre del archivo es obligatorio.').max(200),
});

/** Registro de avances del mantenimiento o reparación que documenta el mecánico (HU15). */
const registrarAvanceSchema = z
  .object({
    diagnostico: z.string().trim().max(2000, 'El diagnóstico no puede superar 2000 caracteres.').optional(),
    tareas: z.array(tareaAvanceSchema).max(50, 'Máximo 50 tareas por registro.').optional(),
    repuestosUtilizados: z
      .array(repuestoUtilizadoSchema)
      .max(50, 'Máximo 50 repuestos por registro.')
      .optional(),
    observacionesTecnicas: z
      .string()
      .trim()
      .max(2000, 'Las observaciones técnicas no pueden superar 2000 caracteres.')
      .optional(),
    archivos: z.array(archivoTallerSchema).max(20, 'Máximo 20 archivos por registro.').optional(),
  })
  .refine(
    (data) =>
      Boolean(data.diagnostico) ||
      Boolean(data.observacionesTecnicas) ||
      (data.tareas?.length ?? 0) > 0 ||
      (data.repuestosUtilizados?.length ?? 0) > 0 ||
      (data.archivos?.length ?? 0) > 0,
    { message: 'Registra al menos un diagnóstico, tarea, repuesto, observación o archivo.' }
  );

const presignArchivoTallerSchema = z.object({
  categoria: z.enum(CATEGORIAS_ARCHIVO_TALLER, {
    message: `La categoría debe ser: ${CATEGORIAS_ARCHIVO_TALLER.join(', ')}.`,
  }),
  contentType: z.string().trim().min(1, 'El tipo de contenido es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre del archivo es obligatorio.').max(200),
  size: z.coerce
    .number({ invalid_type_error: 'El tamaño del archivo es obligatorio.' })
    .int('El tamaño debe ser un número entero.')
    .positive('El tamaño del archivo debe ser mayor a 0.'),
});

const listCitasQuerySchema = z
  .object({
    clienteId: z.string().trim().min(1).optional(),
    vehiculoId: z.string().trim().min(1).optional(),
    mecanicoId: z.string().trim().min(1).optional(),
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
  ESTADOS_CITA_AVANCE,
  TIPOS_SERVICIO,
  CATEGORIAS_ARCHIVO_TALLER,
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
  asignarCitaSchema,
  registrarAvanceSchema,
  presignArchivoTallerSchema,
  listCitasQuerySchema,
  validate,
};
