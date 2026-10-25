const express = require('express');
const cors = require('cors');

const { config } = require('./config');
const { auditoriaMiddleware } = require('./middleware/auditoriaMiddleware');
const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const repuestoRoutes = require('./routes/repuestoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const { notFoundHandler, errorHandler } = require('./errors/errorHandler');

/** Construye y configura la aplicación Express. */
function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(cors({ origin: '*', credentials: false }));
  app.use(express.json());

  // Auditoría de la actividad del sistema (HU18): registra las operaciones de escritura.
  app.use(auditoriaMiddleware);

  app.use(publicRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/catalogo', catalogoRoutes);
  app.use('/api/vehiculos', vehiculoRoutes);
  app.use('/api/repuestos', repuestoRoutes);
  app.use('/api/movimientos', movimientoRoutes);
  app.use('/api/clientes-comerciales', require('./routes/clienteComercialRoutes'));
  app.use('/api/cotizaciones', require('./routes/cotizacionRoutes'));
  app.use('/api/reservas', require('./routes/reservaRoutes'));
  app.use('/api/ventas', require('./routes/ventaRoutes'));
  app.use('/api/pruebas-man', require('./routes/pruebaManejoRoutes'));
  app.use('/api/notificaciones', require('./routes/notificacionRoutes'));
  app.use('/api/citas-taller', require('./routes/citaTallerRoutes'));
  app.use('/api/reportes', require('./routes/reporteRoutes'));
  app.use('/api/auditoria', require('./routes/auditoriaRoutes'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
