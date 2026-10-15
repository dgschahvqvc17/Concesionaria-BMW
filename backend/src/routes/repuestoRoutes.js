const express = require('express');

const repuestoController = require('../controllers/repuestoController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

// Consultar el inventario de repuestos: cualquier usuario autenticado.
router.use(requireAuth);

router.get('/', repuestoController.list);

// Registrar/actualizar: administradores, vendedores y jefes de taller.
const puedeGestionar = requireRole('admin', 'vendedor', 'jefe_taller');

router.post('/', puedeGestionar, repuestoController.create);

router.get('/:repuestoId', repuestoController.getOne);
router.patch('/:repuestoId', puedeGestionar, repuestoController.update);

module.exports = router;
