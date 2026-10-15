const { config, assertAuthConfig } = require('./src/config');
const { createApp } = require('./src/app');

assertAuthConfig();

const app = createApp();
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Servidor de Concesionaria BMW ejecutándose en http://localhost:${PORT}`);
  console.log(`  Región AWS:     ${config.awsRegion}`);
  console.log(`  Tabla DynamoDB: ${config.usuariosTableName}`);
  console.log(`  User Pool:      ${config.userPoolId}`);
});
