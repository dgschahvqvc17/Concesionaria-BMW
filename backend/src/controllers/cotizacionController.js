const {
  createCotizacionSchema,
  updateCotizacionSchema,
  listCotizacionesQuerySchema,
  validate,
} = require('../validation/cotizacionSchemas');
const cotizacionService = require('../services/cotizacionService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/cotizaciones?clienteId=&estado= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listCotizacionesQuerySchema, req.query);
  const cotizaciones = await cotizacionService.listCotizaciones(filtros);
  res.json({ total: cotizaciones.length, cotizaciones });
});

/** GET /api/cotizaciones/:cotizacionId */
const getOne = asyncHandler(async (req, res) => {
  const { cotizacionId } = req.params;
  const cotizacion = await cotizacionService.getCotizacion(cotizacionId);
  res.json({ cotizacion });
});

/** POST /api/cotizaciones */
const create = asyncHandler(async (req, res) => {
  const datos = validate(createCotizacionSchema, req.body);
  const cotizacion = await cotizacionService.createCotizacion(datos, req.auth);
  res.status(201).json({ message: 'Cotización registrada correctamente.', cotizacion });
});

/** PATCH /api/cotizaciones/:cotizacionId */
const update = asyncHandler(async (req, res) => {
  const { cotizacionId } = req.params;
  const datos = validate(updateCotizacionSchema, req.body);
  const cotizacion = await cotizacionService.updateCotizacion(cotizacionId, datos);
  res.json({ message: 'Cotización actualizada correctamente.', cotizacion });
});

/** POST /api/cotizaciones/:cotizacionId/enviar-correo */
const enviarCorreo = asyncHandler(async (req, res) => {
  const { cotizacionId } = req.params;
  const resultado = await cotizacionService.enviarCorreo(cotizacionId, req.auth);
  res.json({
    message: 'Se abrió el correo con la cotización redactada. Adjunta el PDF antes de enviarlo.',
    notificacion: resultado.notificacion,
    mailto: resultado.mailto,
  });
});

module.exports = { list, getOne, create, update, enviarCorreo };
