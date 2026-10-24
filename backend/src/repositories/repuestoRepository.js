const {
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.repuestosTableName;

/**
 * Repositorio de repuestos en DynamoDB.
 * Encapsula el acceso a datos; los servicios no conocen DynamoDB.
 */
async function findById(repuestoId) {
  const result = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { repuestoId } })
  );
  return result.Item ?? null;
}

async function findByCodigo(codigo) {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'codigo-index',
      KeyConditionExpression: 'codigo = :codigo',
      ExpressionAttributeValues: { ':codigo': codigo },
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

async function save(repuesto) {
  await documentClient.send(new PutCommand({ TableName: tableName, Item: repuesto }));
  return repuesto;
}

/**
 * Ajusta las existencias de forma atómica.
 * `delta` es positivo para entradas y negativo para salidas.
 * En las salidas la condición impide dejar el stock en negativo; si no hay
 * existencias suficientes DynamoDB lanza `ConditionalCheckFailedException`.
 */
async function adjustStock(repuestoId, delta) {
  const values = { ':delta': delta, ':now': new Date().toISOString(), ':zero': 0 };
  let condition = 'attribute_exists(repuestoId)';

  if (delta < 0) {
    condition = 'attribute_exists(repuestoId) AND cantidad >= :requerido';
    values[':requerido'] = Math.abs(delta);
  }

  const result = await documentClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { repuestoId },
      UpdateExpression: 'SET cantidad = if_not_exists(cantidad, :zero) + :delta, updatedAt = :now',
      ConditionExpression: condition,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );

  return result.Attributes;
}

module.exports = { findById, findByCodigo, listAll, save, adjustStock };
