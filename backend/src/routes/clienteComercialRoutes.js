const { Router } = require('express');

const clienteComercialController = require('../controllers/clienteComercialController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = Router();

const puedeGestionar = requireRole('admin', 'vendedor');

router.get('/', requireAuth, puedeGestionar, clienteComercialController.list);
router.post('/', requireAuth, puedeGestionar, clienteComercialController.create);
router.get('/:clienteId', requireAuth, puedeGestionar, clienteComercialController.getOne);
router.patch('/:clienteId', requireAuth, puedeGestionar, clienteComercialController.update);
router.post('/:clienteId/consultas', requireAuth, puedeGestionar, clienteComercialController.addConsulta);

module.exports = router;
