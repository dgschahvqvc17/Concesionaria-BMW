const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const { config } = require('../config');

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }));

/** Obtiene un usuario por su `userId` (sub de Cognito). */
async function getUsuario(userId) {
  const result = await client.send(
    new GetCommand({
      TableName: config.usuariosTableName,
      Key: { userId },
    })
  );
  return result.Item || null;
}

/** Guarda (sobrescribe) un usuario. */
async function putUsuario(item) {
  await client.send(
    new PutCommand({
      TableName: config.usuariosTableName,
      Item: item,
    })
  );
  return item;
}

/**
 * Devuelve el usuario; si no existe todavía en DynamoDB lo crea a partir del
 * token de Cognito (estado activo por defecto).
 */
async function ensureUsuario({ userId, email, nombre, rol }) {
  const existing = await getUsuario(userId);
  if (existing) return existing;

  const item = {
    userId,
    email,
    nombre,
    rol,
    estado: 'activo',
    createdAt: new Date().toISOString(),
  };
  await putUsuario(item);
  return item;
}

/** Lista todos los usuarios (solo para administradores). */
async function listUsuarios() {
  const result = await client.send(new ScanCommand({ TableName: config.usuariosTableName }));
  return result.Items || [];
}

module.exports = { getUsuario, putUsuario, ensureUsuario, listUsuarios };
