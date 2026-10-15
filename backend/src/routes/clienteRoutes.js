const express = require('express');

const clienteController = require('../controllers/clienteController');

const router = express.Router();

// Ruta pública: los clientes se autorregistran desde la pantalla de login.
router.post('/registro', clienteController.registrar);

module.exports = router;
