const {
  createPruebaManejoSchema,
  reprogramarPruebaSchema,
  confirmarPruebaSchema,
  cancelarPruebaSchema,
  realizarPruebaSchema,
  listPruebasQuerySchema,
  validate,
} = require('../validation/pruebaManejoSchemas');
const pruebaManejoService = require('../services/pruebaManejoService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/pruebas-man?clienteId=&vehiculoId=&estado= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listPruebasQuerySchema, req.query);
  const pruebas = await pruebaManejoService.listPruebas(filtros);
  res.json({ total: pruebas.length, pruebas });
});

/** GET /api/pruebas-man/:pruebaId */
const getOne = asyncHandler(async (req, res) => {
  const prueba = await pruebaManejoService.getPrueba(req.params.pruebaId);
  res.json({ prueba });
});

/** POST /api/pruebas-man (público desde el catálogo o registrado por el personal) */
const create = asyncHandler(async (req, res) => {
  const datos = validate(createPruebaManejoSchema, req.body);
  const prueba = await pruebaManejoService.createPrueba(datos, req.auth, req.authRoles ?? []);
  res.status(201).json({ message: 'Prueba de manejo solicitada correctamente.', prueba });
});

/** POST /api/pruebas-man/:pruebaId/confirmar */
const confirmar = asyncHandler(async (req, res) => {
  const datos = validate(confirmarPruebaSchema, req.body);
  const prueba = await pruebaManejoService.confirmarPrueba(req.params.pruebaId, datos, req.auth);
  res.json({ message: 'Prueba de manejo confirmada.', prueba });
});

/** POST /api/pruebas-man/:pruebaId/reprogramar */
const reprogramar = asyncHandler(async (req, res) => {
  const datos = validate(reprogramarPruebaSchema, req.body);
  const prueba = await pruebaManejoService.reprogramarPrueba(req.params.pruebaId, datos, req.auth);
  res.json({ message: 'Prueba de manejo reprogramada.', prueba });
});

/** POST /api/pruebas-man/:pruebaId/cancelar */
const cancelar = asyncHandler(async (req, res) => {
  const datos = validate(cancelarPruebaSchema, req.body);
  const prueba = await pruebaManejoService.cancelarPrueba(req.params.pruebaId, datos, req.auth);
  res.json({ message: 'Prueba de manejo cancelada.', prueba });
});

/** POST /api/pruebas-man/:pruebaId/realizar */
const realizar = asyncHandler(async (req, res) => {
  const datos = validate(realizarPruebaSchema, req.body);
  const prueba = await pruebaManejoService.realizarPrueba(req.params.pruebaId, datos, req.auth);
  res.json({ message: 'Prueba de manejo registrada como realizada.', prueba });
});

module.exports = { list, getOne, create, confirmar, reprogramar, cancelar, realizar };
