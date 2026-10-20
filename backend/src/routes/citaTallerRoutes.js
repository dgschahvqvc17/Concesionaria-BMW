const { Router } = require('express');

const citaTallerController = require('../controllers/citaTallerController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'jefe_taller');
/** Los mecánicos también consultan el listado y el detalle, pero solo los suyos (HU14). */
const puedeConsultar = requireRole('admin', 'jefe_taller', 'mecanico');

router.get('/', requireAuth, puedeConsultar, citaTallerController.list);
router.get('/:citaId', requireAuth, puedeConsultar, citaTallerController.getOne);
router.post('/', requireAuth, puedeGestionar, citaTallerController.create);
router.post('/:citaId/confirmar', requireAuth, puedeGestionar, citaTallerController.confirmar);
router.post('/:citaId/reprogramar', requireAuth, puedeGestionar, citaTallerController.reprogramar);
router.post('/:citaId/iniciar', requireAuth, puedeGestionar, citaTallerController.iniciar);
router.post('/:citaId/finalizar', requireAuth, puedeGestionar, citaTallerController.finalizar);
router.post('/:citaId/cancelar', requireAuth, puedeGestionar, citaTallerController.cancelar);
router.post('/:citaId/asignar', requireAuth, puedeGestionar, citaTallerController.asignar);

module.exports = router;
