const express = require('express');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('¡Mi aplicación web está funcionando!');
});

app.get('/bienvenido', (req, res) => {
  res.send('Bienvenido a mi aplicación web.');
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});