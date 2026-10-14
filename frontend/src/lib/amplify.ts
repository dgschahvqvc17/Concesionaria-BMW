import { Amplify } from 'aws-amplify';

const region = import.meta.env.VITE_AWS_REGION;
const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;

/** Configura AWS Amplify contra el User Pool de Cognito creado con CDK. */
export function configureAmplify(): void {
  if (!userPoolId || !userPoolClientId) {
    throw new Error(
      'Faltan credenciales de Cognito en frontend/.env (VITE_USER_POOL_ID y VITE_USER_POOL_CLIENT_ID). Copia .env.example a .env y completa los valores del despliegue de CDK.'
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
      },
    },
  });
}

export const awsConfig = { region, userPoolId, userPoolClientId };
