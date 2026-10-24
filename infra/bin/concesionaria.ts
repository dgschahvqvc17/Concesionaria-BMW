#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { InventarioStack } from '../lib/inventario-stack';
import { RepuestosStack } from '../lib/repuestos-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2',
};

const authStack = new AuthStack(app, 'ConcesionariaBmwAuthStack', {
  env,
  description:
    'HU01 - Iniciar sesión: Cognito User Pool (autenticación + roles por Groups) y tabla DynamoDB de usuarios.',
});

const inventarioStack = new InventarioStack(app, 'ConcesionariaBmwInventarioStack', {
  env,
  description:
    'HU03 - Inventario de vehículos: tabla DynamoDB de vehículos y bucket S3 de fotografías.',
});

const repuestosStack = new RepuestosStack(app, 'ConcesionariaBmwRepuestosStack', {
  env,
  description:
    'HU04/HU07/HU08/HU09/HU10/HU11/HU12/HU13/HU14/HU15/HU16/HU17/HU18 - Repuestos, movimientos, clientes comerciales, cotizaciones, reservas, ventas, pruebas de manejo, notificaciones, citas del taller, historial y auditoría (tablas DynamoDB).',
});

new ApiStack(app, 'ConcesionariaBmwApiStack', {
  env,
  description: 'Backend Express empaquetado con serverless-express en AWS Lambda + Function URL (sin API Gateway/ECS).',
  userPool: authStack.userPool,
  userPoolClient: authStack.userPoolClient,
  usuariosTable: authStack.usuariosTable,
  vehiculosTable: inventarioStack.vehiculosTable,
  repuestosTable: repuestosStack.repuestosTable,
  movimientosTable: repuestosStack.movimientosTable,
  clientesComercialesTable: repuestosStack.clientesComercialesTable,
  cotizacionesTable: repuestosStack.cotizacionesTable,
  reservasTable: repuestosStack.reservasTable,
  ventasTable: repuestosStack.ventasTable,
  pruebasManejoTable: repuestosStack.pruebasManejoTable,
  notificacionesTable: repuestosStack.notificacionesTable,
  citasTallerTable: repuestosStack.citasTallerTable,
  auditoriaTable: repuestosStack.auditoriaTable,
  fotosBucket: inventarioStack.fotosBucket,
});

app.synth();
