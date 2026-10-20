const {
  createCitaTallerSchema,
  reprogramarCitaSchema,
  confirmarCitaSchema,
  iniciarCitaSchema,
  finalizarCitaSchema,
  cancelarCitaSchema,
  listCitasQuerySchema,
  validate,
} = require('../validation/citaTallerSchemas');
const citaTallerService = require('../services/citaTallerService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/citas-taller?clienteId=&vehiculoId=&estado=&fechaDesde=&fechaHasta= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listCitasQuerySchema, req.query);
  const citas = await citaTallerService.listCitas(filtros);
  res.json({ total: citas.length, citas });
});

/** GET /api/citas-taller/:citaId */
const getOne = asyncHandler(async (req, res) => {
  const cita = await citaTallerService.getCita(req.params.citaId);
  res.json({ cita });
});

/** POST /api/citas-taller */
const create = asyncHandler(async (req, res) => {
  const datos = validate(createCitaTallerSchema, req.body);
  const cita = await citaTallerService.createCita(datos, req.auth);
  res.status(201).json({ message: 'Cita del taller registrada correctamente.', cita });
});

/** POST /api/citas-taller/:citaId/confirmar */
const confirmar = asyncHandler(async (req, res) => {
  const datos = validate(confirmarCitaSchema, req.body);
  const cita = await citaTallerService.confirmarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Cita confirmada.', cita });
});

/** POST /api/citas-taller/:citaId/reprogramar */
const reprogramar = asyncHandler(async (req, res) => {
  const datos = validate(reprogramarCitaSchema, req.body);
  const cita = await citaTallerService.reprogramarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Cita reprogramada.', cita });
});

/** POST /api/citas-taller/:citaId/iniciar */
const iniciar = asyncHandler(async (req, res) => {
  const datos = validate(iniciarCitaSchema, req.body);
  const cita = await citaTallerService.iniciarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Atención de la cita iniciada.', cita });
});

/** POST /api/citas-taller/:citaId/finalizar */
const finalizar = asyncHandler(async (req, res) => {
  const datos = validate(finalizarCitaSchema, req.body);
  const cita = await citaTallerService.finalizarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Cita finalizada.', cita });
});

/** POST /api/citas-taller/:citaId/cancelar */
const cancelar = asyncHandler(async (req, res) => {
  const datos = validate(cancelarCitaSchema, req.body);
  const cita = await citaTallerService.cancelarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Cita cancelada.', cita });
});

module.exports = { list, getOne, create, confirmar, reprogramar, iniciar, finalizar, cancelar };
