const { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');

const tableName = config.clientesComercialesTableName;

async function findById(clienteId) {
  const result = await documentClient.send(new GetCommand({ TableName: tableName, Key: { clienteId } }));
  return result.Item ?? null;
}

async function findByEmail(email) {
  const result = await documentClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    Limit: 1,
  }));
  return result.Items?.[0] ?? null;
}

async function findByDocumento(documento) {
  const result = await documentClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'documento-index',
    KeyConditionExpression: 'documento = :documento',
    ExpressionAttributeValues: { ':documento': documento },
    Limit: 1,
  }));
  return result.Items?.[0] ?? null;
}

async function listAll() {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await documentClient.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    items.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function save(cliente) {
  const item = { ...cliente, clienteId: cliente.clienteId || randomUUID(), createdAt: new Date().toISOString() };
  await documentClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return item;
}

async function update(clienteId, updates) {
  const names = {};
  const values = {};
  const sets = [];
  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || k === 'clienteId') continue;
    const name = `#n${i}`;
    const val = `:v${i}`;
    names[name] = k;
    values[val] = v;
    sets.push(`${name} = ${val}`);
    i++;
  }
  if (sets.length === 0) return findById(clienteId);
  sets.push('#updatedAt = :updatedAt');
  values[':updatedAt'] = new Date().toISOString();
  names['#updatedAt'] = 'updatedAt';
  const result = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: { clienteId },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_NEW',
  }));
  return result.Attributes;
}

module.exports = { findById, findByEmail, findByDocumento, listAll, save, update };
