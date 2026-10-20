const { Router } = require('express');

const notificacionController = require('../controllers/notificacionController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.get('/', requireAuth, puedeGestionar, notificacionController.list);
router.get('/:eventoId', requireAuth, puedeGestionar, notificacionController.getOne);
router.post('/:eventoId/enviar', requireAuth, puedeGestionar, notificacionController.enviar);

module.exports = router;
