const usuarioService = require('../services/usuarioService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validate } = require('../validation/usuarioSchemas');
const { registroClienteSchema } = require('../validation/clienteSchemas');

/** POST /api/clientes/registro — autorregistro público de clientes. */
const registrar = asyncHandler(async (req, res) => {
  const data = validate(registroClienteSchema, req.body);
  const usuario = await usuarioService.registrarCliente(data);
  res.status(201).json({
    message: 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
    usuario,
  });
});

module.exports = { registrar };
