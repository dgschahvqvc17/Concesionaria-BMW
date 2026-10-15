require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  awsRegion: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-2',
  userPoolId: process.env.USER_POOL_ID,
  userPoolClientId: process.env.USER_POOL_CLIENT_ID,
  usuariosTableName: process.env.USUARIOS_TABLE_NAME || 'Usuarios',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

/** Valida que la configuración mínima esté presente antes de arrancar. */
function assertAuthConfig() {
  const missing = [];
  if (!config.userPoolId) missing.push('USER_POOL_ID');
  if (!config.userPoolClientId) missing.push('USER_POOL_CLIENT_ID');

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno para Cognito: ${missing.join(', ')}. Copia .env.example a .env y completa los valores del despliegue de CDK.`
    );
  }
}

module.exports = { config, assertAuthConfig };
