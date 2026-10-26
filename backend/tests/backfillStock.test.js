const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  STOCK_INICIAL,
  necesitaStock,
  planificarBackfill,
  escanearVehiculos,
  ejecutarBackfill,
} = require('../scripts/backfill-vehiculo-stock');

const vehiculos = [
  { vehiculoId: 'v1', marca: 'BMW', modelo: 'Serie 1' },
  { vehiculoId: 'v2', marca: 'BMW', modelo: 'Serie 2', stock: 0 },
  { vehiculoId: 'v3', marca: 'BMW', modelo: 'Serie 3', stock: 7 },
];

test('Solo planifica vehículos sin el atributo stock', () => {
  assert.equal(necesitaStock(vehiculos[0]), true);
  assert.equal(necesitaStock(vehiculos[1]), false);
  assert.equal(necesitaStock(vehiculos[2]), false);

  assert.deepEqual(
    planificarBackfill(vehiculos).map((vehiculo) => vehiculo.vehiculoId),
    ['v1']
  );
});

test('El modo simulación no escribe ningún cambio', async () => {
  const llamadas = [];
  const resumen = await ejecutarBackfill({
    vehiculos,
    dryRun: true,
    aplicar: async (vehiculo) => llamadas.push(vehiculo.vehiculoId),
  });

  assert.equal(resumen.total, 3);
  assert.equal(resumen.pendientes, 1);
  assert.equal(resumen.actualizados, 0);
  assert.equal(llamadas.length, 0);
});

test('El modo apply actualiza solo los vehículos sin stock', async () => {
  const llamadas = [];
  const resumen = await ejecutarBackfill({
    vehiculos,
    dryRun: false,
    aplicar: async (vehiculo) => llamadas.push(vehiculo.vehiculoId),
  });

  assert.equal(resumen.actualizados, 1);
  assert.deepEqual(llamadas, ['v1']);
});

test('El backfill usa una condición que no sobrescribe stocks existentes', async () => {
  const comandos = [];
  const client = {
    send: async (command) => {
      comandos.push(command);
      return {};
    },
  };

  const resumen = await ejecutarBackfill({
    vehiculos,
    dryRun: false,
    client,
    tableName: 'VehiculosPrueba',
  });

  assert.equal(resumen.actualizados, 1);
  assert.equal(comandos.length, 1);

  const comando = comandos[0];
  assert.equal(comando.constructor.name, 'UpdateCommand');
  assert.equal(comando.input.TableName, 'VehiculosPrueba');
  assert.equal(comando.input.Key.vehiculoId, 'v1');
  assert.equal(comando.input.UpdateExpression, 'SET stock = :stock');
  assert.equal(
    comando.input.ConditionExpression,
    'attribute_exists(vehiculoId) AND attribute_not_exists(stock)'
  );
  assert.equal(comando.input.ExpressionAttributeValues[':stock'], STOCK_INICIAL);
  assert.equal(STOCK_INICIAL, 0);
});

test('El escaneo pagina los resultados de DynamoDB', async () => {
  const paginas = [
    { Items: [{ vehiculoId: 'v1' }], LastEvaluatedKey: { vehiculoId: 'v1' } },
    { Items: [{ vehiculoId: 'v2', stock: 3 }] },
  ];
  const client = {
    send: async () => paginas.shift(),
  };

  const items = await escanearVehiculos({ client, tableName: 'VehiculosPrueba' });

  assert.equal(items.length, 2);
  assert.equal(items[0].vehiculoId, 'v1');
  assert.equal(items[1].vehiculoId, 'v2');
});
