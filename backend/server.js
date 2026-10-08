const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const vehiculos = [
  { id: 1, marca: 'BMW', modelo: 'Serie 3', anio: 2024, precio: 52000 },
  { id: 2, marca: 'BMW', modelo: 'Serie 5', anio: 2024, precio: 68000 },
  { id: 3, marca: 'BMW', modelo: 'X3', anio: 2024, precio: 61000 },
  { id: 4, marca: 'BMW', modelo: 'X5', anio: 2024, precio: 82000 }
];

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

app.get('/productos', (req, res) => {
  res.json(vehiculos);
});

app.get('/api/productos', (req, res) => {
  res.json({
    total: vehiculos.length,
    productos: vehiculos
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Concesionaria BMW ejecutándose en http://localhost:${PORT}`);
});
