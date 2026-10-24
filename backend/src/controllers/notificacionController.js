const {
  listNotificacionesQuerySchema,
  validate,
} = require('../validation/notificacionSchemas');
const notificacionService = require('../services/notificacionService');
const { asyncHandler } = require('../utils/asyncHandler');

/** GET /api/notificaciones?tipo=&estado=&recursoId= */
const list = asyncHandler(async (req, res) => {
  const filtros = validate(listNotificacionesQuerySchema, req.query);
  const notificaciones = await notificacionService.list(filtros);
  res.json({ total: notificaciones.length, notificaciones });
});

/** GET /api/notificaciones/:eventoId */
const getOne = asyncHandler(async (req, res) => {
  const notificacion = await notificacionService.get(req.params.eventoId);
  res.json({ notificacion });
});

/** POST /api/notificaciones/:eventoId/enviar */
const enviar = asyncHandler(async (req, res) => {
  const resultado = await notificacionService.enviar(req.params.eventoId, req.auth);
  res.json({
    message: 'Se generó el correo con la notificación. Verifica el envío en tu cliente de correo.',
    notificacion: resultado.notificacion,
    mailto: resultado.mailto,
  });
});

module.exports = { list, getOne, enviar };
