const auditoriaService = require('../services/auditoriaService');
const { asyncHandler } = require('../utils/asyncHandler');
const { listAuditoriaQuerySchema, validate } = require('../validation/auditoriaSchemas');

/** GET /api/auditoria — registro de actividad (solo admin, HU18). */
const listar = asyncHandler(async (req, res) => {
  const filtros = validate(listAuditoriaQuerySchema, req.query);
  const eventos = await auditoriaService.listar(filtros);
  res.json({ total: eventos.length, eventos });
});

module.exports = { listar };
