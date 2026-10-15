const express = require('express');

const router = express.Router();

const vehiculos = [
  { id: 1, modelo: 'BMW Serie 3', anio: 2024, tipo: 'Sedán' },
  { id: 2, modelo: 'BMW X5', anio: 2024, tipo: 'SUV' },
  { id: 3, modelo: 'BMW i4', anio: 2025, tipo: 'Eléctrico' },
];

router.get('/', (req, res) => {
  res.send('Bienvenido a la API de la Concesionaria BMW');
});

router.get('/info', (req, res) => {
  res.json({ nombre: 'Concesionaria BMW', version: '1.0.0', estado: 'operativo' });
});

router.get('/api/productos', (req, res) => {
  res.json(vehiculos);
});

module.exports = router;
