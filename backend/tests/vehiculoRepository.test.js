const { test } = require('node:test');
const assert = require('node:assert/strict');

const { documentClient } = require('../src/db/dynamodb');
const vehiculoRepository = require('../src/repositories/vehiculoRepository');

/** Sustituye el transporte de DynamoDB para inspeccionar los comandos reales. */
async function conEnvioFalso(fn) {
  const original = documentClient.send;
  const comandos = [];

  documentClient.send = async (command) => {
    comandos.push(command);
    return { Attributes: { vehiculoId: 'vehiculo-1', estado: 'reservado', stock: 4 } };
  };

  try {
    await fn(comandos);
  } finally {
    documentClient.send = original;
  }
}

test('El repositorio persiste el stock en el PutCommand', async () => {
  await conEnvioFalso(async (comandos) => {
    const guardado = await vehiculoRepository.save({
      vehiculoId: 'vehiculo-1',
      marca: 'BMW',
      modelo: 'Serie 3',
      stock: 12,
    });

    assert.equal(guardado.stock, 12);
    assert.equal(comandos.length, 1);
    assert.equal(comandos[0].constructor.name, 'PutCommand');
    assert.equal(comandos[0].input.Item.stock, 12);
    assert.equal(comandos[0].input.Item.vehiculoId, 'vehiculo-1');
  });
});

test('El cambio de estado condicional no modifica el atributo stock', async () => {
  await conEnvioFalso(async (comandos) => {
    const actualizado = await vehiculoRepository.cambiarEstadoCondicional(
      'vehiculo-1',
      'disponible',
      'reservado',
      { sub: 'usuario-1' }
    );

    assert.equal(actualizado.stock, 4);
    assert.equal(comandos.length, 1);
    assert.equal(comandos[0].constructor.name, 'UpdateCommand');
    assert.ok(!comandos[0].input.UpdateExpression.includes('stock'));
    assert.equal(comandos[0].input.ExpressionAttributeValues[':a'], 'reservado');
  });
});
