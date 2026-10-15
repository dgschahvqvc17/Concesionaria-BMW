const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ mensaje: 'API de la Concesionaria BMW', version: '1.0.0' });
});

router.get('/info', (_req, res) => {
  res.json({ nombre: 'Concesionaria BMW', version: '1.0.0', estado: 'operativo' });
});

module.exports = router;
