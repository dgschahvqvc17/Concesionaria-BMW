const { Router } = require('express');

const cotizacionController = require('../controllers/cotizacionController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.get('/', requireAuth, puedeGestionar, cotizacionController.list);
router.post('/', requireAuth, puedeGestionar, cotizacionController.create);
router.get('/:cotizacionId', requireAuth, puedeGestionar, cotizacionController.getOne);
router.patch('/:cotizacionId', requireAuth, puedeGestionar, cotizacionController.update);
router.post('/:cotizacionId/enviar-correo', requireAuth, puedeGestionar, cotizacionController.enviarCorreo);

module.exports = router;
