const express = require('express');

const vehiculoController = require('../controllers/vehiculoController');
const { requireAuth, requireRole } = require('../auth/middleware');

const router = express.Router();

// Consultar el inventario: cualquier usuario autenticado.
router.use(requireAuth);

router.get('/', vehiculoController.list);

// Registrar/actualizar: solo administradores y vendedores autorizados.
const puedeGestionar = requireRole('admin', 'vendedor');

router.post('/fotos/presign', puedeGestionar, vehiculoController.presignFoto);
router.post('/', puedeGestionar, vehiculoController.create);

router.get('/:vehiculoId', vehiculoController.getOne);
router.patch('/:vehiculoId', puedeGestionar, vehiculoController.update);

module.exports = router;
