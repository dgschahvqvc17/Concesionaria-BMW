const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const { config } = require('../config');

/**
 * Cliente de DynamoDB (documento). Exporta el cliente y el nombre de tabla
 * para que la capa de repositorios no conozca detalles de configuración.
 */
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }), {
  marshallOptions: { removeUndefinedValues: true },
});

module.exports = { documentClient, tableName: config.usuariosTableName };
