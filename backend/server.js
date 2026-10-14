const express = require('express');
const cors = require('cors');

const { config, assertAuthConfig } = require('./src/config');
const { requireAuth, requireRole } = require('./src/auth/middleware');
const { primaryRole } = require('./src/auth/roles');
const { ensureUsuario, listUsuarios } = require('./src/db/dynamodb');

assertAuthConfig();

const app = express();
const PORT = config.port;

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

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

// ---------------------------------------------------------------------------
// HU01 - Iniciar sesión en el sistema
// ---------------------------------------------------------------------------

/**
 * Devuelve el perfil del usuario autenticado (lee DynamoDB validando el JWT).
 * El frontend lo usa para confirmar el rol y que el usuario esté activo.
 */
app.get('/api/auth/session', requireAuth, async (req, res) => {
  const payload = req.auth;
  const userId = payload.sub;
  const email = payload.email || '';
  const nombre = payload.name || email;
  const rol = primaryRole(req.authRoles);

  try {
    const usuario = await ensureUsuario({ userId, email, nombre, rol });

    // HU01: impedir el acceso a usuarios inactivos.
    if (usuario.estado === 'inactivo') {
      return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador del sistema.' });
    }

    return res.json({
      userId,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      estado: usuario.estado,
    });
  } catch (err) {
    // DynamoDB no disponible: respondemos con los datos confiables del JWT.
    return res.json({ userId, email, nombre, rol, estado: 'activo' });
  }
});

// Ejemplo de funcionalidad protegida por rol (solo administradores).
app.get('/api/usuarios', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const usuarios = await listUsuarios();
    return res.json({ total: usuarios.length, usuarios });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo consultar la tabla de usuarios.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor de Concesionaria BMW ejecutándose en http://localhost:${PORT}`);
  console.log(`  Región AWS:       ${config.awsRegion}`);
  console.log(`  Tabla DynamoDB:   ${config.usuariosTableName}`);
  console.log(`  User Pool:        ${config.userPoolId}`);
});
