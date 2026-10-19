const {
  createReservaSchema,
  cancelarReservaSchema,
  convertirReservaSchema,
  listReservasQuerySchema,
  validate,
} = require('../validation/reservaSchemas');
const reservaService = require('../services/reservaService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/reservas?clienteId=&vehiculoId=&estado= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listReservasQuerySchema, req.query);
  const reservas = await reservaService.listReservas(filtros);
  res.json({ total: reservas.length, reservas });
});

/** GET /api/reservas/:reservaId */
const getOne = asyncHandler(async (req, res) => {
  const { reservaId } = req.params;
  const reserva = await reservaService.getReserva(reservaId);
  res.json({ reserva });
});

/** POST /api/reservas */
const create = asyncHandler(async (req, res) => {
  const datos = validate(createReservaSchema, req.body);
  const reserva = await reservaService.createReserva(datos, req.auth);
  res.status(201).json({ message: 'Reserva registrada correctamente.', reserva });
});

/** POST /api/reservas/:reservaId/cancelar */
const cancelar = asyncHandler(async (req, res) => {
  const { reservaId } = req.params;
  const datos = validate(cancelarReservaSchema, req.body);
  const reserva = await reservaService.cancelarReserva(reservaId, datos, req.auth);
  res.json({ message: 'Reserva cancelada correctamente.', reserva });
});

/** POST /api/reservas/:reservaId/convertir */
const convertir = asyncHandler(async (req, res) => {
  const { reservaId } = req.params;
  const datos = validate(convertirReservaSchema, req.body);
  const reserva = await reservaService.convertirReserva(reservaId, datos, req.auth);
  res.json({ message: 'Venta registrada y reserva convertida correctamente.', reserva });
});

module.exports = { list, getOne, create, cancelar, convertir };
