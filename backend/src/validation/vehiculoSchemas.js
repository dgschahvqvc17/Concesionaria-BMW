const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');
const { CATEGORIAS_ARCHIVO } = require('../services/storageService');

const CONDICIONES = ['nuevo', 'seminuevo'];
const ESTADOS = ['disponible', 'reservado', 'vendido', 'no_disponible'];
const TIPOS = ['sedan', 'suv', 'coupe', 'cabrio', 'touring', 'hatchback', 'deportivo', 'otros'];

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

/**
 * Stock disponible: entero no negativo. No se usa `z.coerce` porque convertiría
 * `null` o una cadena vacía en 0; esos valores deben rechazarse.
 */
const stockSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && value.trim() !== '') {
      const numero = Number(value);
      return Number.isNaN(numero) ? value : numero;
    }
    return value;
  },
  z
    .number({
      required_error: 'El stock es obligatorio.',
      invalid_type_error: 'El stock debe ser un número entero.',
    })
    .int('El stock debe ser un número entero.')
    .min(0, 'El stock no puede ser negativo.')
    .max(1000000, 'El stock no puede superar 1.000.000.')
);

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
  stock: stockSchema,
  precio: z.coerce
    .number({ invalid_type_error: 'El precio es obligatorio.' })
    .positive('El precio debe ser mayor a 0.')
    .max(100000000, 'El precio supera el máximo permitido.'),
  color: z.string().trim().min(1, 'El color es obligatorio.').max(40),
  vin: vinSchema,
  condicion: z.enum(CONDICIONES, { message: 'La condición debe ser "nuevo" o "seminuevo".' }),
  tipo: z.enum(TIPOS, { message: 'Tipo de vehículo inválido.' }),
  estado: z.enum(ESTADOS, { message: 'Estado de vehículo inválido.' }).optional(),
  descripcion: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres.')
    .optional(),
  caracteristicas: z
    .array(z.string().trim().min(1).max(80))
    .max(20, 'Máximo 20 características por vehículo.')
    .optional(),
  publicado: z.boolean().optional(),
  fotos: z.array(z.string().trim().min(1)).max(15, 'Máximo 15 fotografías por vehículo.').optional(),
};

const documentoSchema = z.object({
  key: z.string().trim().min(1, 'La clave del archivo es obligatoria.'),
  nombre: z.string().trim().min(1, 'El nombre del archivo es obligatorio.').max(200),
});

vehiculoBase.documentos = z
  .array(documentoSchema)
  .max(20, 'Máximo 20 documentos por vehículo.')
  .optional();

const createVehiculoSchema = z.object(vehiculoBase);

const updateVehiculoSchema = z
  .object({
    marca: vehiculoBase.marca.optional(),
    modelo: vehiculoBase.modelo.optional(),
    anio: vehiculoBase.anio.optional(),
    version: vehiculoBase.version.optional(),
    kilometraje: vehiculoBase.kilometraje.optional(),
    stock: vehiculoBase.stock.optional(),
    precio: vehiculoBase.precio.optional(),
    color: vehiculoBase.color.optional(),
    vin: vehiculoBase.vin.optional(),
    condicion: vehiculoBase.condicion.optional(),
    tipo: vehiculoBase.tipo.optional(),
    estado: z.enum(ESTADOS, { message: 'Estado de vehículo inválido.' }).optional(),
    descripcion: vehiculoBase.descripcion,
    caracteristicas: vehiculoBase.caracteristicas,
    publicado: vehiculoBase.publicado,
    fotos: vehiculoBase.fotos,
    documentos: vehiculoBase.documentos,
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No se enviaron cambios para actualizar.' });

const presignArchivoSchema = z.object({
  categoria: z.enum(CATEGORIAS_ARCHIVO, { message: 'Categoría de archivo inválida.' }),
  contentType: z.string().trim().min(1, 'El tipo de contenido es obligatorio.'),
  nombre: z.string().trim().min(1, 'El nombre del archivo es obligatorio.').max(200),
  size: z.coerce
    .number({ invalid_type_error: 'El tamaño del archivo es obligatorio.' })
    .int('El tamaño debe ser un número entero.')
    .positive('El tamaño del archivo debe ser mayor a 0.'),
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
  TIPOS,
  createVehiculoSchema,
  updateVehiculoSchema,
  presignArchivoSchema,
  validate,
};
