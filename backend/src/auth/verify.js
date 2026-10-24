const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { config } = require('../config');

/** Verificador del ID token de Cognito (firma, expiración, issuer y audience). */
const verifier = CognitoJwtVerifier.create({
  userPoolId: config.userPoolId,
  tokenUse: 'id',
  clientId: config.userPoolClientId,
});

/** Valida un ID token de Cognito y devuelve su payload. Lanza si es inválido. */
async function verifyIdToken(token) {
  return verifier.verify(token);
}

module.exports = { verifyIdToken };
