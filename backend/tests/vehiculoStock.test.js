const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const vehiculoRepository = require('../src/repositories/vehiculoRepository');

// Almacén en memoria que reemplaza DynamoDB únicamente durante estas pruebas.
const store = new Map();

vehiculoRepository.findById = async (vehiculoId) => store.get(vehiculoId) ?? null;

vehiculoRepository.findByVin = async (vin) => {
  for (const vehiculo of store.values()) {
    if (vehiculo.vin === vin) return vehiculo;
  }
  return null;
};

vehiculoRepository.listAll = async () => [...store.values()];

vehiculoRepository.save = async (vehiculo) => {
  const guardado = { ...vehiculo };
  store.set(guardado.vehiculoId, guardado);
  return { ...guardado };
};

const vehiculoController = require('../src/controllers/vehiculoController');
const { errorHandler } = require('../src/errors/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.auth = { sub: 'usuario-prueba', email: 'prueba@bmw.com', name: 'Usuario de prueba' };
  req.authRoles = ['admin'];
  next();
});
app.get('/api/vehiculos', vehiculoController.list);
app.post('/api/vehiculos', vehiculoController.create);
app.get('/api/vehiculos/:vehiculoId', vehiculoController.getOne);
app.patch('/api/vehiculos/:vehiculoId', vehiculoController.update);
app.put('/api/vehiculos/:vehiculoId', vehiculoController.update);
app.use(errorHandler);

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  store.clear();
});

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const body = await response.json();
  return { status: response.status, body };
}

function payload(overrides = {}) {
  return {
    marca: 'BMW',
    modelo: 'Serie 3',
    anio: 2024,
    version: '330i M Sport',
    kilometraje: 1200,
    precio: 50000,
    color: 'Negro Zafiro',
    vin: 'WBA3A5C50DF123456',
    condicion: 'nuevo',
    tipo: 'sedan',
    estado: 'disponible',
    descripcion: 'Vehículo de prueba',
    caracteristicas: ['Techo panorámico'],
    publicado: true,
    fotos: [],
    documentos: [],
    stock: 12,
    ...overrides,
  };
}

function crearLegacy() {
  const legacy = {
    vehiculoId: 'legacy-1',
    marca: 'BMW',
    modelo: 'Serie 1',
    anio: 2019,
    version: '118i',
    kilometraje: 45000,
    precio: 25000,
    color: 'Blanco Alpino',
    vin: 'WBA8E9G50GNT12345',
    condicion: 'seminuevo',
    tipo: 'hatchback',
    estado: 'disponible',
    descripcion: 'Registro anterior al requisito de stock',
    caracteristicas: [],
    publicado: true,
    fotos: [],
    documentos: [],
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    createdBy: null,
    updatedBy: null,
  };
  store.set(legacy.vehiculoId, legacy);
  return legacy;
}

test('Prueba 1: POST con stock=12 responde 201 y guarda stock 12', async () => {
  const { status, body } = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 12 })),
  });

  assert.equal(status, 201);
  assert.equal(body.vehiculo.stock, 12);
  assert.equal(body.vehiculo.marca, 'BMW');
  assert.equal(store.size, 1);
  assert.equal(store.get(body.vehiculo.vehiculoId).stock, 12);
});

test('Prueba 2: POST con stock=-2 responde 400 y no crea el vehículo', async () => {
  const { status, body } = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: -2 })),
  });

  assert.equal(status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.details.some((detalle) => detalle.field === 'stock'));
  assert.equal(store.size, 0);
});

test('Prueba 3: POST con stock=2.5 responde 400 y no crea el vehículo', async () => {
  const { status, body } = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 2.5 })),
  });

  assert.equal(status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.details.some((detalle) => detalle.field === 'stock'));
  assert.equal(store.size, 0);
});

test('POST rechaza stock ausente, null, vacío, no numérico y fuera de rango', async () => {
  const { stock, ...sinStock } = payload();
  const casos = [
    { nombre: 'ausente', datos: sinStock },
    { nombre: 'null', datos: payload({ stock: null }) },
    { nombre: 'vacío', datos: payload({ stock: '' }) },
    { nombre: 'texto', datos: payload({ stock: 'abc' }) },
    { nombre: 'decimal como texto', datos: payload({ stock: '2.5' }) },
    { nombre: 'negativo como texto', datos: payload({ stock: '-2' }) },
    { nombre: 'fuera de rango', datos: payload({ stock: 1000001 }) },
  ];

  for (const caso of casos) {
    const { status, body } = await api('/api/vehiculos', {
      method: 'POST',
      body: JSON.stringify(caso.datos),
    });

    assert.equal(status, 400, `El caso "${caso.nombre}" debía responder 400`);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(
      body.details.some((detalle) => detalle.field === 'stock'),
      `El caso "${caso.nombre}" debía reportar el campo stock`
    );
    assert.equal(store.size, 0, `El caso "${caso.nombre}" no debía crear registros`);
  }
});

test('Prueba 4: PUT con stock=0 responde 200 y persiste el valor cero', async () => {
  const creado = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 12 })),
  });
  const { vehiculoId, marca, precio } = creado.body.vehiculo;

  const { status, body } = await api(`/api/vehiculos/${vehiculoId}`, {
    method: 'PUT',
    body: JSON.stringify({ stock: 0 }),
  });

  assert.equal(status, 200);
  assert.equal(body.vehiculo.stock, 0);
  assert.equal(body.vehiculo.marca, marca);
  assert.equal(body.vehiculo.precio, precio);
  assert.equal(store.get(vehiculoId).stock, 0);
});

test('Prueba 5: PUT con stock inválido responde 400 y conserva los datos anteriores', async () => {
  const creado = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 7 })),
  });
  const { vehiculoId } = creado.body.vehiculo;
  const actualizadoAntes = store.get(vehiculoId);

  const casos = [
    { nombre: 'negativo', stock: -1 },
    { nombre: 'decimal', stock: 2.5 },
    { nombre: 'null', stock: null },
    { nombre: 'vacío', stock: '' },
    { nombre: 'texto', stock: 'abc' },
  ];

  for (const caso of casos) {
    const { status, body } = await api(`/api/vehiculos/${vehiculoId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock: caso.stock }),
    });

    assert.equal(status, 400, `El caso "${caso.nombre}" debía responder 400`);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.details.some((detalle) => detalle.field === 'stock'));
    assert.equal(store.get(vehiculoId).stock, 7, `El caso "${caso.nombre}" no debía cambiar el stock`);
    assert.equal(store.get(vehiculoId).updatedAt, actualizadoAntes.updatedAt);
  }
});

test('Prueba 6: GET de listado y GET por ID devuelven el stock correcto', async () => {
  const creado = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 12 })),
  });
  const { vehiculoId } = creado.body.vehiculo;

  const listado = await api('/api/vehiculos');
  assert.equal(listado.status, 200);
  assert.equal(listado.body.total, 1);
  assert.equal(listado.body.vehiculos[0].stock, 12);

  const detalle = await api(`/api/vehiculos/${vehiculoId}`);
  assert.equal(detalle.status, 200);
  assert.equal(detalle.body.vehiculo.stock, 12);
});

test('Un vehículo antiguo sin stock se consulta y actualiza sin errores', async () => {
  const legacy = crearLegacy();

  const consulta = await api(`/api/vehiculos/${legacy.vehiculoId}`);
  assert.equal(consulta.status, 200);
  assert.equal(consulta.body.vehiculo.stock, 0);
  assert.equal(consulta.body.vehiculo.modelo, 'Serie 1');

  const edicion = await api(`/api/vehiculos/${legacy.vehiculoId}`, {
    method: 'PUT',
    body: JSON.stringify({ precio: 26000 }),
  });

  assert.equal(edicion.status, 200);
  assert.equal(edicion.body.vehiculo.precio, 26000);
  assert.equal(edicion.body.vehiculo.stock, 0);
  assert.equal(store.get(legacy.vehiculoId).stock, 0);
  assert.equal(store.get(legacy.vehiculoId).modelo, 'Serie 1');
});

test('El cambio de estado conserva el stock existente', async () => {
  const creado = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 5 })),
  });
  const { vehiculoId } = creado.body.vehiculo;

  const { status, body } = await api(`/api/vehiculos/${vehiculoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'reservado' }),
  });

  assert.equal(status, 200);
  assert.equal(body.vehiculo.estado, 'reservado');
  assert.equal(body.vehiculo.stock, 5);
  assert.equal(store.get(vehiculoId).stock, 5);
});

test('PATCH sigue funcionando como actualización parcial con stock', async () => {
  const creado = await api('/api/vehiculos', {
    method: 'POST',
    body: JSON.stringify(payload({ stock: 3 })),
  });
  const { vehiculoId } = creado.body.vehiculo;

  const { status, body } = await api(`/api/vehiculos/${vehiculoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stock: 9, color: 'Azul M' }),
  });

  assert.equal(status, 200);
  assert.equal(body.vehiculo.stock, 9);
  assert.equal(body.vehiculo.color, 'Azul M');
  assert.equal(store.get(vehiculoId).stock, 9);
});
