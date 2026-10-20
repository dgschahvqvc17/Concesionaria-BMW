const { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.notificacionesTableName;

async function findById(eventoId) {
  const result = await documentClient.send(new GetCommand({ TableName: tableName, Key: { eventoId } }));
  return result.Item ?? null;
}

/** Notificaciones de un recurso (GSI `recurso-index`), de más reciente a más antigua. */
async function findByRecurso(recursoId) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'recurso-index',
      KeyConditionExpression: 'recursoId = :recursoId',
      ExpressionAttributeValues: { ':recursoId': recursoId },
      ScanIndexForward: false,
      ExclusiveStartKey,
    }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey,
    }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

/**
 * Guarda la notificación solo si su `eventoId` es nuevo (dedup atómico):
 * si el evento ya tiene registro para ese destinatario, devuelve `null`.
 */
async function save(notificacion) {
  try {
    await documentClient.send(new PutCommand({
      TableName: tableName,
      Item: notificacion,
      ConditionExpression: 'attribute_not_exists(eventoId)',
    }));
    return notificacion;
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') return null;
    throw error;
  }
}

async function update(eventoId, updates) {
  const names = {};
  const values = {};
  const sets = [];
  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || k === 'eventoId') continue;
    const name = `#n${i}`;
    const val = `:v${i}`;
    names[name] = k;
    values[val] = v;
    sets.push(`${name} = ${val}`);
    i++;
  }
  if (sets.length === 0) return findById(eventoId);
  sets.push('#updatedAt = :updatedAt');
  values[':updatedAt'] = new Date().toISOString();
  names['#updatedAt'] = 'updatedAt';
  const result = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { eventoId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

module.exports = { findById, findByRecurso, listAll, save, update };
