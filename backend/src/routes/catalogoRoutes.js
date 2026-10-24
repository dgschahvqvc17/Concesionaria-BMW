const express = require('express');

const catalogoController = require('../controllers/catalogoController');

const router = express.Router();

// Catálogo web público: no requiere autenticación (HU05).
router.get('/', catalogoController.list);
router.get('/:vehiculoId', catalogoController.getOne);

module.exports = router;
