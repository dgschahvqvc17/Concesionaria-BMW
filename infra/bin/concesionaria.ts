#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { InventarioStack } from '../lib/inventario-stack';
import { RepuestosStack } from '../lib/repuestos-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2',
};

new AuthStack(app, 'ConcesionariaBmwAuthStack', {
  env,
  description:
    'HU01 - Iniciar sesión: Cognito User Pool (autenticación + roles por Groups) y tabla DynamoDB de usuarios.',
});

new InventarioStack(app, 'ConcesionariaBmwInventarioStack', {
  env,
  description:
    'HU03 - Inventario de vehículos: tabla DynamoDB de vehículos y bucket S3 de fotografías.',
});

new RepuestosStack(app, 'ConcesionariaBmwRepuestosStack', {
  env,
  description:
    'HU04/HU07/HU08/HU09 - Repuestos, movimientos, clientes comerciales, cotizaciones y reservas (tablas DynamoDB).',
});

app.synth();
