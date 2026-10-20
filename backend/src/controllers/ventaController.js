const {
  createVentaSchema,
  listVentasQuerySchema,
  validate,
} = require('../validation/ventaSchemas');
const ventaService = require('../services/ventaService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/ventas?clienteId=&vehiculoId= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listVentasQuerySchema, req.query);
  const ventas = await ventaService.listVentas(filtros);
  res.json({ total: ventas.length, ventas });
});

/** GET /api/ventas/:ventaId */
const getOne = asyncHandler(async (req, res) => {
  const { ventaId } = req.params;
  const venta = await ventaService.getVenta(ventaId);
  res.json({ venta });
});

/** POST /api/ventas */
const create = asyncHandler(async (req, res) => {
  const datos = validate(createVentaSchema, req.body);
  const venta = await ventaService.createVenta(datos, req.auth);
  res.status(201).json({ message: 'Venta registrada correctamente.', venta });
});

module.exports = { list, getOne, create };
