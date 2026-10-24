const { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.reservasTableName;

/** Prefijo de la partición auxiliar que guarda el consecutivo anual de números. */
const PREFIJO_SECUENCIA = 'secuencia#';

async function findById(reservaId) {
  const result = await documentClient.send(new GetCommand({ TableName: tableName, Key: { reservaId } }));
  return result.Item ?? null;
}

async function findByNumero(numero) {
  const result = await documentClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'numero-index',
    KeyConditionExpression: 'numero = :numero',
    ExpressionAttributeValues: { ':numero': numero },
    Limit: 1,
  }));
  return result.Items?.[0] ?? null;
}

/** Reservas de un cliente (GSI `cliente-index`). */
async function findByCliente(clienteId) {
  return queryByIndex('cliente-index', 'clienteId', clienteId);
}

/** Reservas de un vehículo (GSI `vehiculo-index`), útil para detectar reservas activas. */
async function findByVehiculo(vehiculoId) {
  return queryByIndex('vehiculo-index', 'vehiculoId', vehiculoId);
}

async function queryByIndex(indexName, keyName, value) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: '#k = :v',
      ExpressionAttributeNames: { '#k': keyName },
      ExpressionAttributeValues: { ':v': value },
      ExclusiveStartKey,
    }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

/** Lista todas las reservas (excluye las particiones de secuencia). */
async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'NOT begins_with(reservaId, :prefijo)',
      ExpressionAttributeValues: { ':prefijo': PREFIJO_SECUENCIA },
      ExclusiveStartKey,
    }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

/**
 * Reserva el siguiente número de la secuencia anual de forma atómica
 * (`ADD` es una operación atómica de DynamoDB: no hay números repetidos).
 */
async function siguienteSecuencia(anio) {
  const result = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { reservaId: `${PREFIJO_SECUENCIA}${anio}` },
    UpdateExpression: 'ADD secuencia :uno',
    ExpressionAttributeValues: { ':uno': 1 },
    ReturnValues: 'UPDATED_NEW',
  }));
  return Number(result.Attributes?.secuencia ?? 1);
}

async function save(reserva) {
  const item = { ...reserva, reservaId: reserva.reservaId || randomUUID() };
  await documentClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return item;
}

async function update(reservaId, updates) {
  const names = {};
  const values = {};
  const sets = [];
  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || k === 'reservaId') continue;
    const name = `#n${i}`;
    const val = `:v${i}`;
    names[name] = k;
    values[val] = v;
    sets.push(`${name} = ${val}`);
    i++;
  }
  if (sets.length === 0) return findById(reservaId);
  sets.push('#updatedAt = :updatedAt');
  values[':updatedAt'] = new Date().toISOString();
  names['#updatedAt'] = 'updatedAt';
  const result = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { reservaId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

module.exports = { findById, findByNumero, findByCliente, findByVehiculo, listAll, siguienteSecuencia, save, update };
