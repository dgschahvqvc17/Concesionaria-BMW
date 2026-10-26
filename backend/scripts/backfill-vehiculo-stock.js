const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../src/db/dynamodb');
const { config } = require('../src/config');

const STOCK_INICIAL = 0;

/** Indica si un vehículo necesita el backfill de stock. */
function necesitaStock(vehiculo) {
  return Boolean(vehiculo && vehiculo.vehiculoId && vehiculo.stock === undefined);
}

/** Devuelve solo los vehículos que aún no tienen el atributo stock. */
function planificarBackfill(vehiculos) {
  return (vehiculos ?? []).filter(necesitaStock);
}

/** Recorre la tabla de vehículos paginando los resultados. */
async function escanearVehiculos({
  client = documentClient,
  tableName = config.vehiculosTableName,
} = {}) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const page = await client.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

/**
 * Aplica el backfill de stock. En modo `dryRun` solo calcula el resumen.
 * La función `aplicar` se puede inyectar en las pruebas.
 */
async function ejecutarBackfill({
  vehiculos,
  dryRun = true,
  aplicar,
  client = documentClient,
  tableName = config.vehiculosTableName,
} = {}) {
  const pendientes = planificarBackfill(vehiculos);
  const resumen = {
    total: (vehiculos ?? []).length,
    pendientes: pendientes.length,
    actualizados: 0,
    dryRun,
  };

  if (dryRun) return resumen;

  const escribir =
    aplicar ??
    (async (vehiculo) => {
      await client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { vehiculoId: vehiculo.vehiculoId },
          UpdateExpression: 'SET stock = :stock',
          ConditionExpression: 'attribute_exists(vehiculoId) AND attribute_not_exists(stock)',
          ExpressionAttributeValues: { ':stock': STOCK_INICIAL },
        })
      );
    });

  for (const vehiculo of pendientes) {
    await escribir(vehiculo);
    resumen.actualizados += 1;
  }

  return resumen;
}

async function main() {
  const aplicar = process.argv.includes('--apply');
  const dryRun = !aplicar;

  const vehiculos = await escanearVehiculos();
  const resumen = await ejecutarBackfill({ vehiculos, dryRun });

  console.log(`Vehículos revisados: ${resumen.total}`);
  console.log(`Vehículos sin stock: ${resumen.pendientes}`);

  if (dryRun) {
    console.log(
      'Modo simulación: no se escribió nada. Ejecuta con --apply para asignar stock = 0 a los vehículos sin stock.'
    );
  } else {
    console.log(`Vehículos actualizados: ${resumen.actualizados}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('No se pudo ejecutar el backfill de stock:', error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  STOCK_INICIAL,
  necesitaStock,
  planificarBackfill,
  escanearVehiculos,
  ejecutarBackfill,
  main,
};
