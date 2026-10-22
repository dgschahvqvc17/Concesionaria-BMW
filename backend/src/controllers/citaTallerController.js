const {
  createCitaTallerSchema,
  reprogramarCitaSchema,
  confirmarCitaSchema,
  iniciarCitaSchema,
  finalizarCitaSchema,
  cancelarCitaSchema,
  asignarCitaSchema,
  registrarAvanceSchema,
  presignArchivoTallerSchema,
  listCitasQuerySchema,
  buscarHistorialQuerySchema,
  validate,
} = require('../validation/citaTallerSchemas');
const citaTallerService = require('../services/citaTallerService');
const { ForbiddenError } = require('../errors/AppError');
const { asyncHandler } = require('../utils/asyncHandler');

/** Un mecánico solo consulta sus propias citas; el gestor ve y filtra todo (HU14). */
function esGestor(req) {
  return (req.authRoles ?? []).some((rol) => rol === 'admin' || rol === 'jefe_taller');
}

/** Actor enriquecido con sus roles para las reglas de autoría (HU15). */
function actor(req) {
  return { ...req.auth, roles: req.authRoles ?? [] };
}

/** GET /api/citas-taller?clienteId=&vehiculoId=&mecanicoId=&estado=&fechaDesde=&fechaHasta= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listCitasQuerySchema, req.query);
  if (!esGestor(req)) filtros.mecanicoId = req.auth?.sub;
  const citas = await citaTallerService.listCitas(filtros);
  const conArchivos = await Promise.all(citas.map((cita) => citaTallerService.toResponse(cita)));
  res.json({ total: conArchivos.length, citas: conArchivos });
});

/** GET /api/citas-taller/:citaId */
const getOne = asyncHandler(async (req, res) => {
  const cita = await citaTallerService.getCita(req.params.citaId);
  if (!esGestor(req) && cita.mecanicoId !== req.auth?.sub) {
    throw new ForbiddenError('Solo puede consultar las citas asignadas a su persona.');
  }
  res.json({ cita: await citaTallerService.toResponse(cita) });
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
  const cita = await citaTallerService.iniciarCita(req.params.citaId, datos, actor(req));
  res.json({ message: 'Atención de la cita iniciada.', cita });
});

/** POST /api/citas-taller/:citaId/finalizar */
const finalizar = asyncHandler(async (req, res) => {
  const datos = validate(finalizarCitaSchema, req.body);
  const cita = await citaTallerService.finalizarCita(req.params.citaId, datos, actor(req));
  res.json({ message: 'Cita finalizada.', cita });
});

/** POST /api/citas-taller/:citaId/cancelar */
const cancelar = asyncHandler(async (req, res) => {
  const datos = validate(cancelarCitaSchema, req.body);
  const cita = await citaTallerService.cancelarCita(req.params.citaId, datos, req.auth);
  res.json({ message: 'Cita cancelada.', cita });
});

/** POST /api/citas-taller/:citaId/asignar */
const asignar = asyncHandler(async (req, res) => {
  const datos = validate(asignarCitaSchema, req.body);
  const cita = await citaTallerService.asignarMecanico(req.params.citaId, datos, req.auth);
  res.json({ message: 'Mecánico asignado a la cita.', cita });
});

/** POST /api/citas-taller/:citaId/avances */
const registrarAvance = asyncHandler(async (req, res) => {
  const datos = validate(registrarAvanceSchema, req.body);
  const cita = await citaTallerService.registrarAvance(req.params.citaId, datos, actor(req));
  const respuesta = await citaTallerService.toResponse(cita);
  res.json({ message: 'Avance del trabajo registrado correctamente.', cita: respuesta });
});

/** POST /api/citas-taller/:citaId/archivos/presign */
const presignArchivo = asyncHandler(async (req, res) => {
  const datos = validate(presignArchivoTallerSchema, req.body);
  const archivo = await citaTallerService.presignArchivoTaller(req.params.citaId, datos, actor(req));
  res.json(archivo);
});

/** GET /api/citas-taller/historial?vin=&vehiculoId= */
const historial = asyncHandler(async (req, res) => {
  const { vin, vehiculoId } = validate(buscarHistorialQuerySchema, req.query);
  const resultado = await citaTallerService.resolverVehiculoHistorial({ vin, vehiculoId });
  res.json(resultado);
});

/** GET /api/citas-taller/historial/:vehiculoId */
const historialPorVehiculo = asyncHandler(async (req, res) => {
  const resultado = await citaTallerService.historialVehiculo(req.params.vehiculoId);
  res.json(resultado);
});

module.exports = {
  list,
  getOne,
  create,
  confirmar,
  reprogramar,
  iniciar,
  finalizar,
  cancelar,
  asignar,
  registrarAvance,
  presignArchivo,
  historial,
  historialPorVehiculo,
};
