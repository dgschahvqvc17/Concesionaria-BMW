const vehiculoService = require('../services/vehiculoService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  validate,
  createVehiculoSchema,
  updateVehiculoSchema,
  presignArchivoSchema,
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

/** POST /api/vehiculos/archivos/presign */
const presignArchivo = asyncHandler(async (req, res) => {
  const data = validate(presignArchivoSchema, req.body);
  const archivo = await vehiculoService.presignArchivo(data);
  res.json(archivo);
});

module.exports = { list, getOne, create, update, presignArchivo };
