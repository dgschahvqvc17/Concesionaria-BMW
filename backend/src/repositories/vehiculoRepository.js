const { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.vehiculosTableName;

/**
 * Repositorio de vehículos en DynamoDB.
 * Encapsula el acceso a datos; los servicios no conocen DynamoDB.
 */
async function findById(vehiculoId) {
  const result = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { vehiculoId } })
  );
  return result.Item ?? null;
}

async function findByVin(vin) {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'vin-index',
      KeyConditionExpression: 'vin = :vin',
      ExpressionAttributeValues: { ':vin': vin },
      Limit: 1,
    })
  );
  return result.Items?.[0] ?? null;
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

async function save(vehiculo) {
  await documentClient.send(new PutCommand({ TableName: tableName, Item: vehiculo }));
  return vehiculo;
}

/**
 * Cambia el estado del vehículo solo si su estado actual es `de` (condición
 * atómica). Devuelve el vehículo actualizado o `null` si la condición no se
 * cumplió (p. ej. otra reserva cambió el estado primero).
 */
async function cambiarEstadoCondicional(vehiculoId, de, a, actor) {
  const ahora = new Date().toISOString();
  try {
    const result = await documentClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { vehiculoId },
      UpdateExpression: 'SET #estado = :a, #updatedAt = :ahora, #updatedBy = :actor',
      ConditionExpression: '#estado = :de',
      ExpressionAttributeNames: {
        '#estado': 'estado',
        '#updatedAt': 'updatedAt',
        '#updatedBy': 'updatedBy',
      },
      ExpressionAttributeValues: { ':a': a, ':de': de, ':ahora': ahora, ':actor': actor?.sub ?? null },
      ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes;
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') return null;
    throw error;
  }
}

module.exports = { findById, findByVin, listAll, save, cambiarEstadoCondicional };
