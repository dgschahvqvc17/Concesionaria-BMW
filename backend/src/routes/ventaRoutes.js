const { Router } = require('express');

const ventaController = require('../controllers/ventaController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.get('/', requireAuth, puedeGestionar, ventaController.list);
router.post('/', requireAuth, puedeGestionar, ventaController.create);
router.get('/:ventaId', requireAuth, puedeGestionar, ventaController.getOne);

module.exports = router;
