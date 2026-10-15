require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  awsRegion: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-2',
  userPoolId: process.env.USER_POOL_ID,
  userPoolClientId: process.env.USER_POOL_CLIENT_ID,
  usuariosTableName: process.env.USUARIOS_TABLE_NAME || 'Usuarios',
  vehiculosTableName: process.env.VEHICULOS_TABLE_NAME || 'Vehiculos',
  repuestosTableName: process.env.REPUESTOS_TABLE_NAME || 'Repuestos',
  movimientosTableName: process.env.MOVIMIENTOS_TABLE_NAME || 'MovimientosInventario',
  fotosBucketName: process.env.FOTOS_BUCKET_NAME,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

/** Valida que la configuración mínima esté presente antes de arrancar. */
function assertAuthConfig() {
  const missing = [];
  if (!config.userPoolId) missing.push('USER_POOL_ID');
  if (!config.userPoolClientId) missing.push('USER_POOL_CLIENT_ID');
  if (!config.fotosBucketName) missing.push('FOTOS_BUCKET_NAME');

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}. Copia .env.example a .env y completa los valores del despliegue de CDK.`
    );
  }
}

module.exports = { config, assertAuthConfig };
