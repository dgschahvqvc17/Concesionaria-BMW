const { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.cotizacionesTableName;

/** Prefijo de la partición auxiliar que guarda el consecutivo anual de números. */
const PREFIJO_SECUENCIA = 'secuencia#';

async function findById(cotizacionId) {
  const result = await documentClient.send(new GetCommand({ TableName: tableName, Key: { cotizacionId } }));
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

/** Historial de cotizaciones de un cliente (GSI `cliente-index`). */
async function findByCliente(clienteId) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: 'cliente-index',
      KeyConditionExpression: 'clienteId = :clienteId',
      ExpressionAttributeValues: { ':clienteId': clienteId },
      ExclusiveStartKey,
    }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

/** Lista todas las cotizaciones (excluye las particiones de secuencia). */
async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'NOT begins_with(cotizacionId, :prefijo)',
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
    Key: { cotizacionId: `${PREFIJO_SECUENCIA}${anio}` },
    UpdateExpression: 'ADD secuencia :uno',
    ExpressionAttributeValues: { ':uno': 1 },
    ReturnValues: 'UPDATED_NEW',
  }));
  return Number(result.Attributes?.secuencia ?? 1);
}

async function save(cotizacion) {
  const item = { ...cotizacion, cotizacionId: cotizacion.cotizacionId || randomUUID() };
  await documentClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return item;
}

async function update(cotizacionId, updates) {
  const names = {};
  const values = {};
  const sets = [];
  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || k === 'cotizacionId') continue;
    const name = `#n${i}`;
    const val = `:v${i}`;
    names[name] = k;
    values[val] = v;
    sets.push(`${name} = ${val}`);
    i++;
  }
  if (sets.length === 0) return findById(cotizacionId);
  sets.push('#updatedAt = :updatedAt');
  values[':updatedAt'] = new Date().toISOString();
  names['#updatedAt'] = 'updatedAt';
  const result = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { cotizacionId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

module.exports = { findById, findByNumero, findByCliente, listAll, siguienteSecuencia, save, update };
