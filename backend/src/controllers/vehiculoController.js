const vehiculoService = require('../services/vehiculoService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  validate,
  createVehiculoSchema,
  updateVehiculoSchema,
  presignFotoSchema,
} = require('../validation/vehiculoSchemas');

/** GET /api/vehiculos */
const list = asyncHandler(async (req, res) => {
  const vehiculos = await vehiculoService.listVehiculos();
  res.json({ total: vehiculos.length, vehiculos });
});

/** GET /api/vehiculos/:vehiculoId */
const getOne = asyncHandler(async (req, res) => {
  const vehiculo = await vehiculoService.getVehiculo(req.params.vehiculoId);
  res.json({ vehiculo });
});

/** POST /api/vehiculos */
const create = asyncHandler(async (req, res) => {
  const data = validate(createVehiculoSchema, req.body);
  const vehiculo = await vehiculoService.createVehiculo(data, req.auth);
  res.status(201).json({ message: 'Vehículo registrado correctamente.', vehiculo });
});

/** PATCH /api/vehiculos/:vehiculoId */
const update = asyncHandler(async (req, res) => {
  const data = validate(updateVehiculoSchema, req.body);
  const vehiculo = await vehiculoService.updateVehiculo(req.params.vehiculoId, data, req.auth);
  res.json({ message: 'Vehículo actualizado correctamente.', vehiculo });
});

/** POST /api/vehiculos/fotos/presign */
const presignFoto = asyncHandler(async (req, res) => {
  const { contentType } = validate(presignFotoSchema, req.body);
  const result = await vehiculoService.createFotoUploadUrl({ contentType });
  res.json(result);
});

module.exports = { list, getOne, create, update, presignFoto };
