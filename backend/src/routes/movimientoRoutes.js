const express = require('express');

const movimientoController = require('../controllers/movimientoController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

// Historial de movimientos: cualquier usuario autenticado.
router.use(requireAuth);

router.get('/', movimientoController.list);

// Registrar entradas/salidas: administradores, vendedores y jefes de taller.
const puedeGestionar = requireRole('admin', 'vendedor', 'jefe_taller');

router.post('/', puedeGestionar, movimientoController.create);

module.exports = router;
