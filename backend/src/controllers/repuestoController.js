const repuestoService = require('../services/repuestoService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validate, createRepuestoSchema, updateRepuestoSchema } = require('../validation/repuestoSchemas');

/** GET /api/repuestos */
const list = asyncHandler(async (req, res) => {
  const repuestos = await repuestoService.listRepuestos();
  res.json({ total: repuestos.length, repuestos });
});

/** GET /api/repuestos/:repuestoId */
const getOne = asyncHandler(async (req, res) => {
  const repuesto = await repuestoService.getRepuesto(req.params.repuestoId);
  res.json({ repuesto });
});

/** POST /api/repuestos */
const create = asyncHandler(async (req, res) => {
  const data = validate(createRepuestoSchema, req.body);
  const repuesto = await repuestoService.createRepuesto(data, req.auth);
  res.status(201).json({ message: 'Repuesto registrado correctamente.', repuesto });
});

/** PATCH /api/repuestos/:repuestoId */
const update = asyncHandler(async (req, res) => {
  const data = validate(updateRepuestoSchema, req.body);
  const repuesto = await repuestoService.updateRepuesto(req.params.repuestoId, data, req.auth);
  res.json({ message: 'Repuesto actualizado correctamente.', repuesto });
});

module.exports = { list, getOne, create, update };
