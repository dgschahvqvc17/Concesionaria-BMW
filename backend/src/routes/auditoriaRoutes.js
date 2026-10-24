const { Router } = require('express');

const auditoriaController = require('../controllers/auditoriaController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

// Auditoría del sistema (HU18): solo administradores. Solo lectura, inmutable.
router.use(requireAuth, requireRole('admin'));

router.get('/', auditoriaController.listar);

module.exports = router;
