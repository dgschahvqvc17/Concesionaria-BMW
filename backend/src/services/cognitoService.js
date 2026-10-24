const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const { config } = require('../config');

const client = new CognitoIdentityProviderClient({ region: config.awsRegion });

const pool = () => config.userPoolId;

/** Obtiene el valor de un atributo del usuario de Cognito. */
function getAttribute(user, name) {
  const attributes = user.Attributes ?? user.UserAttributes ?? [];
  return attributes.find((attr) => attr.Name === name)?.Value;
}

/** Crea un usuario en Cognito con contraseña permanente (sin enviar correo). */
async function createUser({ email, nombre, password }) {
  await client.send(
    new AdminCreateUserCommand({
      UserPoolId: pool(),
      Username: email,
      MessageAction: 'SUPPRESS',
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: nombre },
      ],
    })
  );

  await client.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: pool(),
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
}

/** Obtiene el usuario de Cognito (AdminGetUser devuelve los atributos en `UserAttributes`). */
async function getUser(username) {
  return client.send(new AdminGetUserCommand({ UserPoolId: pool(), Username: username }));
}

/** Elimina un usuario de Cognito (usado como compensación ante fallos). */
async function deleteUser(username) {
  await client.send(new AdminDeleteUserCommand({ UserPoolId: pool(), Username: username }));
}

/** Lista los grupos (roles) a los que pertenece un usuario. */
async function listGroups(username) {
  const { Groups } = await client.send(
    new AdminListGroupsForUserCommand({ UserPoolId: pool(), Username: username })
  );
  return (Groups ?? []).map((group) => group.GroupName);
}

/** Deja al usuario únicamente en los grupos indicados. */
async function setGroups(username, groups) {
  const current = await listGroups(username);

  await Promise.all(
    current
      .filter((group) => !groups.includes(group))
      .map((group) =>
        client.send(
          new AdminRemoveUserFromGroupCommand({ UserPoolId: pool(), Username: username, GroupName: group })
        )
      )
  );

  await Promise.all(
    groups
      .filter((group) => !current.includes(group))
      .map((group) =>
        client.send(
          new AdminAddUserToGroupCommand({ UserPoolId: pool(), Username: username, GroupName: group })
        )
      )
  );
}

/** Habilita o deshabilita (activa/inactiva) la cuenta en Cognito. */
async function setEnabled(username, enabled) {
  const Command = enabled ? AdminEnableUserCommand : AdminDisableUserCommand;
  await client.send(new Command({ UserPoolId: pool(), Username: username }));
}

module.exports = { createUser, getUser, deleteUser, listGroups, setGroups, setEnabled, getAttribute };
