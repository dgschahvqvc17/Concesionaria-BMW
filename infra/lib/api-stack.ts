import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
  usuariosTable: dynamodb.ITable;
  vehiculosTable: dynamodb.ITable;
  repuestosTable: dynamodb.ITable;
  movimientosTable: dynamodb.ITable;
  clientesComercialesTable: dynamodb.ITable;
  cotizacionesTable: dynamodb.ITable;
  reservasTable: dynamodb.ITable;
  ventasTable: dynamodb.ITable;
  pruebasManejoTable: dynamodb.ITable;
  notificacionesTable: dynamodb.ITable;
  citasTallerTable: dynamodb.ITable;
  auditoriaTable: dynamodb.ITable;
  fotosBucket: s3.IBucket;
}

export class ApiStack extends cdk.Stack {
  public readonly apiFunctionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'BackendApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../backend'), {
        exclude: [
          '.git',
          '.gitignore',
          '.env',
          '*.log',
          'node_modules/.cache',
        ],
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production',
        USER_POOL_ID: props.userPool.userPoolId,
        USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
        USUARIOS_TABLE_NAME: props.usuariosTable.tableName,
        VEHICULOS_TABLE_NAME: props.vehiculosTable.tableName,
        REPUESTOS_TABLE_NAME: props.repuestosTable.tableName,
        MOVIMIENTOS_TABLE_NAME: props.movimientosTable.tableName,
        CLIENTES_COMERCIALES_TABLE_NAME: props.clientesComercialesTable.tableName,
        COTIZACIONES_TABLE_NAME: props.cotizacionesTable.tableName,
        RESERVAS_TABLE_NAME: props.reservasTable.tableName,
        VENTAS_TABLE_NAME: props.ventasTable.tableName,
        PRUEBAS_MANEJO_TABLE_NAME: props.pruebasManejoTable.tableName,
        NOTIFICACIONES_TABLE_NAME: props.notificacionesTable.tableName,
        CITAS_TALLER_TABLE_NAME: props.citasTallerTable.tableName,
        AUDITORIA_TABLE_NAME: props.auditoriaTable.tableName,
        FOTOS_BUCKET_NAME: props.fotosBucket.bucketName,
        CORS_ORIGIN: '*',
      },
    });

    props.usuariosTable.grantReadWriteData(fn);
    props.vehiculosTable.grantReadWriteData(fn);
    props.repuestosTable.grantReadWriteData(fn);
    props.movimientosTable.grantReadWriteData(fn);
    props.clientesComercialesTable.grantReadWriteData(fn);
    props.cotizacionesTable.grantReadWriteData(fn);
    props.reservasTable.grantReadWriteData(fn);
    props.ventasTable.grantReadWriteData(fn);
    props.pruebasManejoTable.grantReadWriteData(fn);
    props.notificacionesTable.grantReadWriteData(fn);
    props.citasTallerTable.grantReadWriteData(fn);
    props.auditoriaTable.grantReadWriteData(fn);

    props.fotosBucket.grantReadWrite(fn);

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminGetUser',
          'cognito-idp:ListUsers',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminDisableUser',
          'cognito-idp:AdminEnableUser',
        ],
        resources: [props.userPool.userPoolArn],
      })
    );

    this.apiFunctionUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
        allowCredentials: false,
      },
    });

    new cdk.CfnOutput(this, 'ApiFunctionUrl', {
      value: this.apiFunctionUrl.url,
      description: 'URL del backend Express en Lambda (Function URL, sin API Gateway)',
    });
    new cdk.CfnOutput(this, 'ApiFunctionName', {
      value: fn.functionName,
      description: 'Nombre de la función Lambda',
    });
  }
}
