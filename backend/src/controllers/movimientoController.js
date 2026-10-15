const movimientoService = require('../services/movimientoService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validate, createMovimientoSchema } = require('../validation/movimientoSchemas');

/** GET /api/movimientos?repuestoId=&tipo= */
const list = asyncHandler(async (req, res) => {
  const { repuestoId, tipo } = req.query;
  const movimientos = await movimientoService.listMovimientos({ repuestoId, tipo });
  res.json({ total: movimientos.length, movimientos });
});

/** POST /api/movimientos */
const create = asyncHandler(async (req, res) => {
  const data = validate(createMovimientoSchema, req.body);
  const { movimiento, repuesto } = await movimientoService.registrarMovimiento(data, req.auth);
  res.status(201).json({ message: 'Movimiento registrado correctamente.', movimiento, repuesto });
});

module.exports = { list, create };
