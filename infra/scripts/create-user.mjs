/**
 * Alta de un usuario de prueba (o administrador) en el User Pool de Cognito,
 * con su rol asignado como Group de Cognito.
 *
 * Uso (desde infra/):
 *   USER_POOL_ID=us-east-2_XXXX EMAIL=admin@bmw.com PASSWORD='Passw0rd' ROLE=admin NAME='Ana Pérez' npm run create-user
 *
 * Requiere credenciales AWS válidas en el entorno (aws configure / variables).
 */
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-2';
const USER_POOL_ID = process.env.USER_POOL_ID;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD || 'Passw0rd123';
const ROLE = process.env.ROLE || 'vendedor';
const NAME = process.env.NAME || 'Usuario Demo';

const ROLES = ['admin', 'vendedor', 'jefe_taller', 'mecanico'];

if (!USER_POOL_ID || !EMAIL) {
  console.error('Faltan variables. Ejemplo:');
  console.error("  USER_POOL_ID=us-east-2_XXXX EMAIL=admin@bmw.com PASSWORD='Passw0rd123' ROLE=admin NAME='Ana Pérez' npm run create-user");
  process.exit(1);
}

if (!ROLES.includes(ROLE)) {
  console.error(`ROLE inválido: "${ROLE}". Debe ser uno de: ${ROLES.join(', ')}`);
  process.exit(1);
}

const client = new CognitoIdentityProviderClient({ region: REGION });

async function main() {
  console.log(`Creando usuario ${EMAIL} en pool ${USER_POOL_ID} con rol "${ROLE}"...`);

  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: EMAIL,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: EMAIL },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: NAME },
      ],
    })
  );

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: EMAIL,
      Password: PASSWORD,
      Permanent: true,
    })
  );

  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: EMAIL,
      GroupName: ROLE,
    })
  );

  await client.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: EMAIL,
      UserAttributes: [{ Name: 'name', Value: NAME }],
    })
  );

  console.log('✔ Usuario creado correctamente.');
  console.log(`  Email:  ${EMAIL}`);
  console.log(`  Rol:    ${ROLE}`);
  console.log(`  Nombre: ${NAME}`);
}

main().catch((err) => {
  console.error('✖ Error:', err.name, '-', err.message);
  process.exit(1);
});
