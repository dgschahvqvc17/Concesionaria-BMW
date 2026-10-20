const { Router } = require('express');

const citaTallerController = require('../controllers/citaTallerController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'jefe_taller');

router.get('/', requireAuth, puedeGestionar, citaTallerController.list);
router.get('/:citaId', requireAuth, puedeGestionar, citaTallerController.getOne);
router.post('/', requireAuth, puedeGestionar, citaTallerController.create);
router.post('/:citaId/confirmar', requireAuth, puedeGestionar, citaTallerController.confirmar);
router.post('/:citaId/reprogramar', requireAuth, puedeGestionar, citaTallerController.reprogramar);
router.post('/:citaId/iniciar', requireAuth, puedeGestionar, citaTallerController.iniciar);
router.post('/:citaId/finalizar', requireAuth, puedeGestionar, citaTallerController.finalizar);
router.post('/:citaId/cancelar', requireAuth, puedeGestionar, citaTallerController.cancelar);

module.exports = router;
