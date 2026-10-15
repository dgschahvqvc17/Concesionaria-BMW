const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const { config } = require('../config');

/**
 * Cliente de DynamoDB (documento) compartido por todos los repositorios.
 * Los repositorios obtienen el nombre de su tabla desde la configuración.
 */
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.awsRegion }), {
  marshallOptions: { removeUndefinedValues: true },
});

module.exports = { documentClient };
