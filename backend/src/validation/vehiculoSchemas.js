const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const CONDICIONES = ['nuevo', 'seminuevo'];
const ESTADOS = ['disponible', 'reservado', 'vendido', 'no_disponible'];

/**
 * VIN estándar de 17 caracteres alfanuméricos (sin I, O ni Q).
 * Se normaliza a mayúsculas antes de validar.
 */
const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'El VIN debe tener 17 caracteres alfanuméricos válidos (sin I, O ni Q).');

const anioActual = new Date().getFullYear();

const vehiculoBase = {
  marca: z.string().trim().min(2, 'La marca es obligatoria.').max(50),
  modelo: z.string().trim().min(1, 'El modelo es obligatorio.').max(60),
  anio: z.coerce
    .number({ invalid_type_error: 'El año es obligatorio.' })
    .int('El año debe ser un número entero.')
    .min(1950, 'El año no puede ser anterior a 1950.')
    .max(anioActual + 1, `El año no puede ser mayor a ${anioActual + 1}.`),
  version: z.string().trim().min(1, 'La versión es obligatoria.').max(80),
  kilometraje: z.coerce
    .number({ invalid_type_error: 'El kilometraje es obligatorio.' })
    .int('El kilometraje debe ser un número entero.')
    .min(0, 'El kilometraje no puede ser negativo.'),
  precio: z.coerce
    .number({ invalid_type_error: 'El precio es obligatorio.' })
    .positive('El precio debe ser mayor a 0.')
    .max(100000000, 'El precio supera el máximo permitido.'),
  color: z.string().trim().min(1, 'El color es obligatorio.').max(40),
  vin: vinSchema,
  condicion: z.enum(CONDICIONES, { message: 'La condición debe ser "nuevo" o "seminuevo".' }),
  estado: z.enum(ESTADOS, { message: 'Estado de vehículo inválido.' }).optional(),
  fotos: z.array(z.string().trim().min(1)).max(15, 'Máximo 15 fotografías por vehículo.').optional(),
};

const createVehiculoSchema = z.object(vehiculoBase);

const updateVehiculoSchema = z
  .object({
    marca: vehiculoBase.marca.optional(),
    modelo: vehiculoBase.modelo.optional(),
    anio: vehiculoBase.anio.optional(),
    version: vehiculoBase.version.optional(),
    kilometraje: vehiculoBase.kilometraje.optional(),
    precio: vehiculoBase.precio.optional(),
    color: vehiculoBase.color.optional(),
    vin: vehiculoBase.vin.optional(),
    condicion: vehiculoBase.condicion.optional(),
    estado: z.enum(ESTADOS, { message: 'Estado de vehículo inválido.' }).optional(),
    fotos: vehiculoBase.fotos,
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No se enviaron cambios para actualizar.' });

const presignFotoSchema = z.object({
  contentType: z.string().trim().min(1, 'El tipo de contenido es obligatorio.'),
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

module.exports = {
  CONDICIONES,
  ESTADOS,
  createVehiculoSchema,
  updateVehiculoSchema,
  presignFotoSchema,
  validate,
};
