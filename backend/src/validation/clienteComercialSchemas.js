const { z } = require('zod');

const { ValidationError } = require('../errors/AppError');

const emailSchema = z.string().trim().email('Ingresa un correo electrónico válido.').max(120);
const docSchema = z.string().trim().min(5).max(20).regex(/^[A-Za-z0-9-]+$/);
const telefonoSchema = z.string().trim().regex(/^[0-9+\s()-]{7,15}$/);

const consultaClienteSchema = z.object({
  fecha: z.string().trim().optional(),
  vehiculo: z.string().trim().min(1).max(80).optional(),
  interes: z.string().trim().min(1).max(500, 'El interés no puede superar los 500 caracteres.'),
  observacion: z.string().trim().max(500).optional(),
});

const clienteComercialBase = {
  nombres: z.string().trim().min(2).max(60),
  apellidos: z.string().trim().min(2).max(60),
  documento: docSchema,
  telefono: telefonoSchema,
  email: emailSchema,
  consultas: z.array(consultaClienteSchema).optional(),
  notas: z.string().trim().max(1000).optional(),
  estadoSeguimiento: z.enum(['nuevo', 'contactado', 'cotizando', 'reservado', 'vendido', 'cerrado']).optional(),
};

const createClienteComercialSchema = z.object(clienteComercialBase);

const updateClienteComercialSchema = z.object({
  nombres: clienteComercialBase.nombres.optional(),
  apellidos: clienteComercialBase.apellidos.optional(),
  documento: clienteComercialBase.documento.optional(),
  telefono: clienteComercialBase.telefono.optional(),
  email: clienteComercialBase.email.optional(),
  notas: clienteComercialBase.notas,
  estadoSeguimiento: clienteComercialBase.estadoSeguimiento,
}).refine((d) => Object.keys(d).length > 0, { message: 'No se enviaron cambios para actualizar.' });

function validate(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    throw new ValidationError('Datos inválidos.', details);
  }
  return result.data;
}

module.exports = {
  createClienteComercialSchema,
  updateClienteComercialSchema,
  consultaClienteSchema,
  validate,
};
