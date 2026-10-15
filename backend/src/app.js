const express = require('express');
const cors = require('cors');

const { config } = require('./config');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const repuestoRoutes = require('./routes/repuestoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const { notFoundHandler, errorHandler } = require('./errors/errorHandler');

/** Construye y configura la aplicación Express. */
function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use(publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/vehiculos', vehiculoRoutes);
  app.use('/api/repuestos', repuestoRoutes);
  app.use('/api/movimientos', movimientoRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
