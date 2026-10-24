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
  clientesComercialesTableName: process.env.CLIENTES_COMERCIALES_TABLE_NAME || 'ClientesComerciales',
  cotizacionesTableName: process.env.COTIZACIONES_TABLE_NAME || 'Cotizaciones',
  reservasTableName: process.env.RESERVAS_TABLE_NAME || 'Reservas',
  ventasTableName: process.env.VENTAS_TABLE_NAME || 'Ventas',
  pruebasManejoTableName: process.env.PRUEBAS_MANEJO_TABLE_NAME || 'PruebasManejo',
  notificacionesTableName: process.env.NOTIFICACIONES_TABLE_NAME || 'Notificaciones',
  citasTallerTableName: process.env.CITAS_TALLER_TABLE_NAME || 'CitasTaller',
  auditoriaTableName: process.env.AUDITORIA_TABLE_NAME || 'Auditoria',
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
