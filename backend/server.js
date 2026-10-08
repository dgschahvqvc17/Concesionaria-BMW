const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Bienvenido a Concesionaria BMW');
});

app.get('/bienvenido', (req, res) => {
  res.send('Bienvenido a Concesionaria BMW.');
});

app.get('/info', (req, res) => {
  res.send('Concesionaria BMW es un sistema para la presentación y gestión de vehículos BMW.');
});

app.get('/contacto', (req, res) => {
  res.send('Concesionaria BMW - Teléfono: 70000000 - Correo: contacto@bmw.com (datos ficticios de demostración)');
});

app.get('/vehiculos', (req, res) => {
  res.send('Vehículos BMW disponibles: BMW Serie 3, BMW Serie 5, BMW X3, BMW X5');
});

app.listen(PORT, () => {
  console.log(`Servidor de Concesionaria BMW ejecutándose en http://localhost:${PORT}`);
});
