import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Roles del sistema. Se materializan como "Groups" en Cognito.
 * El rol del usuario viaja dentro del ID token en el claim `cognito:groups`.
 * El orden define la precedencia (menor índice = mayor jerarquía).
 */
export const USER_ROLES = ['admin', 'vendedor', 'jefe_taller', 'mecanico', 'cliente'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface AuthStackProps extends cdk.StackProps {
  /** Habilita el alta de cuentas por parte del usuario (self sign-up). */
  selfSignUpEnabled?: boolean;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly usuariosTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: AuthStackProps = {}) {
    super(scope, id, props);

    const selfSignUpEnabled = props.selfSignUpEnabled ?? true;

    // ------------------------------------------------------------------
    // Cognito User Pool: autenticación de usuarios (email + contraseña)
    // ------------------------------------------------------------------
    this.userPool = new cognito.UserPool(this, 'UsuariosUserPool', {
      selfSignUpEnabled,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: cdk.Duration.days(3),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      signInCaseSensitive: false,
    });

    // Cada usuario se copia con su rol en un grupo.
    USER_ROLES.forEach((role, index) => {
      new cognito.CfnUserPoolGroup(this, `Grupo_${role}`, {
        userPoolId: this.userPool.userPoolId,
        groupName: role,
        description: `Rol ${role} del sistema Concesionaria BMW`,
        precedence: index,
      });
    });

    // App Client para SPA (React): sin secreto, flujo SRP + contraseña.
    this.userPoolClient = this.userPool.addClient('SpaAppClient', {
      generateSecret: false,
      preventUserExistenceErrors: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // ------------------------------------------------------------------
    // DynamoDB: datos de perfil del usuario (rol, estado activo, nombre)
    // PK = userId = `sub` del JWT de Cognito.
    // ------------------------------------------------------------------
    this.usuariosTable = new dynamodb.Table(this, 'UsuariosTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.usuariosTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ------------------------------------------------------------------
    // Outputs: valores que el frontend y el backend necesitan configurar
    // ------------------------------------------------------------------
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'UserPoolId de Cognito (frontend/.env y backend/.env)',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'App Client ID sin secreto (frontend/.env)',
    });
    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'ARN del User Pool (backend: verificación de JWT)',
    });
    new cdk.CfnOutput(this, 'UsuariosTableName', {
      value: this.usuariosTable.tableName,
      description: 'Nombre de la tabla DynamoDB de usuarios (backend/.env)',
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Región AWS desplegada',
    });
  }
}
