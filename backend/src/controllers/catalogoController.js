const vehiculoService = require('../services/vehiculoService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/catalogo */
const list = asyncHandler(async (_req, res) => {
  const vehiculos = await vehiculoService.listCatalogo();
  res.json({ total: vehiculos.length, vehiculos });
});

/** GET /api/catalogo/:vehiculoId */
const getOne = asyncHandler(async (req, res) => {
  const vehiculo = await vehiculoService.getCatalogoVehiculo(req.params.vehiculoId);
  res.json({ vehiculo });
});

module.exports = { list, getOne };
