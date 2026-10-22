const reporteService = require('../services/reporteService');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  listReporteQuerySchema,
  tipoReporteParamSchema,
  validate,
} = require('../validation/reporteSchemas');

/** GET /api/reportes — resumen consolidado con filtros de fecha (HU17). */
const resumen = asyncHandler(async (req, res) => {
  const { fechaDesde, fechaHasta } = validate(listReporteQuerySchema, req.query);
  const reporte = await reporteService.resumen({ fechaDesde, fechaHasta });
  res.json(reporte);
});

/** GET /api/reportes/:tipo — reporte de un tipo concreto (HU17). */
const porTipo = asyncHandler(async (req, res) => {
  const { tipo } = validate(tipoReporteParamSchema, req.params);
  const { fechaDesde, fechaHasta } = validate(listReporteQuerySchema, req.query);
  const reporte = await reporteService.porTipo(tipo, { fechaDesde, fechaHasta });
  res.json(reporte);
});

module.exports = { resumen, porTipo };
