const express = require('express');

const usuarioController = require('../controllers/usuarioController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

// Mecánicos activos para asignar trabajos del taller (HU14): jefe de taller también consulta.
router.get('/mecanicos', requireAuth, requireRole('admin', 'jefe_taller'), usuarioController.listMecanicos);

// Toda la gestión de usuarios queda restringida a administradores.
router.use(requireAuth, requireRole('admin'));

router.get('/', usuarioController.list);
router.post('/', usuarioController.create);
router.get('/:userId', usuarioController.getOne);
router.patch('/:userId', usuarioController.update);
router.patch('/:userId/estado', usuarioController.changeEstado);

module.exports = router;
