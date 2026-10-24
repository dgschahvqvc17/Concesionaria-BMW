const { Router } = require('express');

const reporteController = require('../controllers/reporteController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

// Reportes de gestión (HU17): solo administradores y vendedores (gerencia).
router.use(requireAuth, requireRole('admin', 'vendedor'));

router.get('/', reporteController.resumen);
router.get('/:tipo', reporteController.porTipo);

module.exports = router;
