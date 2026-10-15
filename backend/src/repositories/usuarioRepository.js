const { GetCommand, PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient, tableName } = require('../db/dynamodb');

/**
 * Repositorio de usuarios en DynamoDB.
 * Encapsula todo el acceso a datos; los servicios no conocen DynamoDB directamente.
 */
async function findById(userId) {
  const result = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { userId } })
  );
  return result.Item ?? null;
}

async function findByEmail(email) {
  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
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

async function save(usuario) {
  await documentClient.send(new PutCommand({ TableName: tableName, Item: usuario }));
  return usuario;
}

module.exports = { findById, findByEmail, listAll, save };
