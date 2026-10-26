const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const repuestoRepository = require('../src/repositories/repuestoRepository');

// Almacén en memoria que reemplaza DynamoDB únicamente durante estas pruebas.
const store = new Map();

repuestoRepository.findById = async (repuestoId) => store.get(repuestoId) ?? null;

repuestoRepository.findByCodigo = async (codigo) => {
  for (const repuesto of store.values()) {
    if (repuesto.codigo === codigo) return repuesto;
  }
  return null;
};

repuestoRepository.listAll = async () => [...store.values()];

repuestoRepository.save = async (repuesto) => {
  const guardado = { ...repuesto };
  store.set(guardado.repuestoId, guardado);
  return { ...guardado };
};

const repuestoController = require('../src/controllers/repuestoController');
const { errorHandler } = require('../src/errors/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.auth = { sub: 'usuario-prueba', email: 'prueba@bmw.com', name: 'Usuario de prueba' };
  req.authRoles = ['admin'];
  next();
});
app.get('/api/repuestos', repuestoController.list);
app.post('/api/repuestos', repuestoController.create);
app.get('/api/repuestos/:repuestoId', repuestoController.getOne);
app.patch('/api/repuestos/:repuestoId', repuestoController.update);
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
    codigo: 'REP-0001',
    nombre: 'Pastillas de freno',
    descripcion: 'Juego delantero',
    precio: 250,
    cantidad: 10,
    cantidadMinima: 2,
    categoria: 'Frenos',
    ...overrides,
  };
}

function crearLegacy() {
  const legacy = {
    repuestoId: 'legacy-1',
    codigo: 'REP-LEGACY',
    nombre: 'Filtro antiguo',
    descripcion: 'Registro anterior al requisito',
    precio: 100,
    cantidad: 5,
    cantidadMinima: 1,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    createdBy: null,
    updatedBy: null,
  };
  store.set(legacy.repuestoId, legacy);
  return legacy;
}

test('Prueba 1: crea un repuesto válido y devuelve HTTP 201 con su categoría', async () => {
  const { status, body } = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload()),
  });

  assert.equal(status, 201);
  assert.equal(body.repuesto.categoria, 'Frenos');
  assert.equal(body.repuesto.nombre, 'Pastillas de freno');
  assert.equal(body.repuesto.precio, 250);
  assert.equal(store.size, 1);
});

test('Prueba 2: rechaza con HTTP 400 una categoría vacía y no crea el repuesto', async () => {
  const { status, body } = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: '   ' })),
  });

  assert.equal(status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.details.some((detalle) => detalle.field === 'categoria'));
  assert.equal(store.size, 0);
});

test('Prueba 3: rechaza con HTTP 400 una categoría de 41 caracteres y no crea el repuesto', async () => {
  const { status, body } = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: 'a'.repeat(41) })),
  });

  assert.equal(status, 400);
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.ok(body.details.some((detalle) => detalle.field === 'categoria'));
  assert.equal(store.size, 0);
});

test('Prueba 4: actualiza la categoría de Motor a Accesorios y conserva los demás campos', async () => {
  const creado = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: 'Motor' })),
  });
  const { repuestoId, nombre, precio } = creado.body.repuesto;

  const { status, body } = await api(`/api/repuestos/${repuestoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ categoria: 'Accesorios' }),
  });

  assert.equal(status, 200);
  assert.equal(body.repuesto.categoria, 'Accesorios');
  assert.equal(body.repuesto.nombre, nombre);
  assert.equal(body.repuesto.precio, precio);
  assert.equal(store.get(repuestoId).categoria, 'Accesorios');
});

test('Prueba 5: consulta un repuesto por ID e incluye la categoría', async () => {
  const creado = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: 'Frenos' })),
  });

  const { status, body } = await api(`/api/repuestos/${creado.body.repuesto.repuestoId}`);

  assert.equal(status, 200);
  assert.equal(body.repuesto.categoria, 'Frenos');
});

test('Prueba 6: consulta y edita un registro antiguo sin categoría sin provocar errores', async () => {
  const legacy = crearLegacy();

  const consulta = await api(`/api/repuestos/${legacy.repuestoId}`);
  assert.equal(consulta.status, 200);
  assert.equal(consulta.body.repuesto.nombre, 'Filtro antiguo');
  assert.equal(consulta.body.repuesto.cantidad, 5);
  assert.equal(consulta.body.repuesto.categoria, undefined);

  const edicion = await api(`/api/repuestos/${legacy.repuestoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ precio: 120 }),
  });
  assert.equal(edicion.status, 200);
  assert.equal(edicion.body.repuesto.precio, 120);
  assert.equal(edicion.body.repuesto.nombre, 'Filtro antiguo');
  assert.equal(edicion.body.repuesto.categoria, undefined);
  assert.equal(store.get(legacy.repuestoId).categoria, undefined);
});

test('Prueba 7: persiste la categoría normalizada y la devuelve en una nueva consulta', async () => {
  const creado = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: '  Frenos  ' })),
  });
  const { repuestoId } = creado.body.repuesto;

  assert.equal(creado.status, 201);
  assert.equal(creado.body.repuesto.categoria, 'Frenos');
  assert.equal(store.get(repuestoId).categoria, 'Frenos');

  const actualizado = await api(`/api/repuestos/${repuestoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ categoria: '  Accesorios  ' }),
  });
  assert.equal(actualizado.status, 200);
  assert.equal(actualizado.body.repuesto.categoria, 'Accesorios');
  assert.equal(store.get(repuestoId).categoria, 'Accesorios');

  const consulta = await api(`/api/repuestos/${repuestoId}`);
  assert.equal(consulta.status, 200);
  assert.equal(consulta.body.repuesto.categoria, 'Accesorios');
});

test('El listado devuelve la categoría de cada repuesto', async () => {
  await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ codigo: 'REP-0001', categoria: 'Frenos' })),
  });
  await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ codigo: 'REP-0002', categoria: 'Motor' })),
  });

  const { status, body } = await api('/api/repuestos');

  assert.equal(status, 200);
  assert.equal(body.total, 2);
  assert.deepEqual(
    body.repuestos.map((repuesto) => repuesto.categoria).sort(),
    ['Frenos', 'Motor']
  );
});

test('Rechaza con HTTP 400 categorías nulas o que no son texto', async () => {
  const conNull = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: null })),
  });
  const conNumero = await api('/api/repuestos', {
    method: 'POST',
    body: JSON.stringify(payload({ categoria: 123 })),
  });

  assert.equal(conNull.status, 400);
  assert.equal(conNumero.status, 400);
  assert.equal(store.size, 0);
});
