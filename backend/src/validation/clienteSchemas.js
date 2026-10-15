const { z } = require('zod');

const { passwordSchema } = require('./usuarioSchemas');

/** Verifica que una fecha `AAAA-MM-DD` exista, no sea futura y sea razonable. */
function esFechaValida(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, anio, mes, dia] = match.map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));

  const esReal =
    date.getUTCFullYear() === anio && date.getUTCMonth() === mes - 1 && date.getUTCDate() === dia;
  if (!esReal) return false;
  if (anio < 1900) return false;

  return date.getTime() <= Date.now();
}

/** HU: autorregistro de clientes desde el login. */
const registroClienteSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre completo debe tener al menos 3 caracteres.').max(80),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').max(120),
  password: passwordSchema,
  fechaNacimiento: z
    .string()
    .trim()
    .refine(esFechaValida, 'Ingresa una fecha de nacimiento válida (AAAA-MM-DD).'),
  carnetIdentidad: z
    .string()
    .trim()
    .min(5, 'El carnet de identidad debe tener al menos 5 caracteres.')
    .max(20, 'El carnet de identidad no debe superar 20 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'El carnet de identidad solo admite letras, números y guiones.'),
  celular: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{7,15}$/, 'Ingresa un número de celular válido (entre 7 y 15 dígitos).'),
});

module.exports = { registroClienteSchema };
