const { Router } = require('express');

const reservaController = require('../controllers/reservaController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.get('/', requireAuth, puedeGestionar, reservaController.list);
router.post('/', requireAuth, puedeGestionar, reservaController.create);
router.get('/:reservaId', requireAuth, puedeGestionar, reservaController.getOne);
router.post('/:reservaId/cancelar', requireAuth, puedeGestionar, reservaController.cancelar);
router.post('/:reservaId/convertir', requireAuth, puedeGestionar, reservaController.convertir);

module.exports = router;
