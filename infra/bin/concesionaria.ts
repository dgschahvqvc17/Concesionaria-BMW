#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';

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

app.synth();
