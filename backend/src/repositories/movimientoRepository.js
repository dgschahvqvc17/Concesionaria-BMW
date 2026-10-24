const { GetCommand, PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.movimientosTableName;

/**
 * Repositorio de movimientos de inventario en DynamoDB.
 * Cada movimiento representa una entrada o salida de existencias de un repuesto.
 */
async function findById(movimientoId) {
  const result = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { movimientoId } })
  );
  return result.Item ?? null;
}

async function save(movimiento) {
  await documentClient.send(new PutCommand({ TableName: tableName, Item: movimiento }));
  return movimiento;
}

async function listAll() {
  const items = [];
  let ExclusiveStartKey;

  do {
    const page = await documentClient.send(
      new ScanCommand({ TableName: tableName, ExclusiveStartKey })
    );
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

/** Movimientos de un repuesto concreto, del más reciente al más antiguo. */
async function listByRepuesto(repuestoId) {
  const items = [];
  let ExclusiveStartKey;

  do {
    const page = await documentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'repuesto-index',
        KeyConditionExpression: 'repuestoId = :repuestoId',
        ExpressionAttributeValues: { ':repuestoId': repuestoId },
        ScanIndexForward: false,
        ExclusiveStartKey,
      })
    );
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

module.exports = { findById, save, listAll, listByRepuesto };
