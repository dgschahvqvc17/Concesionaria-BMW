const {
  createClienteComercialSchema,
  updateClienteComercialSchema,
  consultaClienteSchema,
  validate,
} = require('../validation/clienteComercialSchemas');
const clienteComercialService = require('../services/clienteComercialService');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (_req, res) => {
  const clientes = await clienteComercialService.listClientes();
  res.json({ total: clientes.length, clientes });
});

const getOne = asyncHandler(async (req, res) => {
  const { clienteId } = req.params;
  const cliente = await clienteComercialService.getCliente(clienteId);
  res.json({ cliente });
});

const create = asyncHandler(async (req, res) => {
  const datos = validate(createClienteComercialSchema, req.body);
  const cliente = await clienteComercialService.createCliente(datos);
  res.status(201).json({ message: 'Cliente comercial registrado correctamente.', cliente });
});

const update = asyncHandler(async (req, res) => {
  const { clienteId } = req.params;
  const datos = validate(updateClienteComercialSchema, req.body);
  const cliente = await clienteComercialService.updateCliente(clienteId, datos);
  res.json({ message: 'Cliente comercial actualizado correctamente.', cliente });
});

const addConsulta = asyncHandler(async (req, res) => {
  const { clienteId } = req.params;
  const consulta = validate(consultaClienteSchema, req.body);
  const cliente = await clienteComercialService.addConsulta(clienteId, consulta);
  res.status(201).json({ message: 'Consulta registrada correctamente.', cliente });
});

module.exports = { list, getOne, create, update, addConsulta };
