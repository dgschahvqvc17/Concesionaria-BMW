const { z } = require('zod');

const { STAFF_ROLES } = require('../auth/roles');
const { ValidationError } = require('../errors/AppError');

const ESTADOS = ['activo', 'inactivo'];

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una minúscula.')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula.')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.');

const createUsuarioSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(80),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(120),
  rol: z.enum(STAFF_ROLES, { message: 'El rol seleccionado no es válido.' }),
  password: passwordSchema,
});

const updateUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(80).optional(),
    rol: z.enum(STAFF_ROLES, { message: 'El rol seleccionado no es válido.' }).optional(),
    estado: z.enum(ESTADOS, { message: 'El estado debe ser "activo" o "inactivo".' }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No se enviaron cambios para actualizar.' });

const setEstadoSchema = z.object({
  estado: z.enum(ESTADOS, { message: 'El estado debe ser "activo" o "inactivo".' }),
});

/** Valida `data` contra un esquema zod y lanza ValidationError con detalles. */
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
  ESTADOS,
  passwordSchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  setEstadoSchema,
  validate,
};
