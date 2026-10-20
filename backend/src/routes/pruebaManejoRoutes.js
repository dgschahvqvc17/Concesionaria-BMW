const { Router } = require('express');

const pruebaManejoController = require('../controllers/pruebaManejoController');
const { requireAuth, optionalAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.post('/', optionalAuth, pruebaManejoController.create);
router.get('/', requireAuth, puedeGestionar, pruebaManejoController.list);
router.get('/:pruebaId', requireAuth, puedeGestionar, pruebaManejoController.getOne);
router.post('/:pruebaId/confirmar', requireAuth, puedeGestionar, pruebaManejoController.confirmar);
router.post('/:pruebaId/reprogramar', requireAuth, puedeGestionar, pruebaManejoController.reprogramar);
router.post('/:pruebaId/cancelar', requireAuth, puedeGestionar, pruebaManejoController.cancelar);
router.post('/:pruebaId/realizar', requireAuth, puedeGestionar, pruebaManejoController.realizar);

module.exports = router;
