import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * HU03 - Gestionar el inventario de vehículos.
 * Tabla DynamoDB `Vehiculos` (con índice por VIN para evitar duplicados)
 * y bucket S3 privado para las fotografías (acceso mediante URLs prefirmadas).
 */
export class InventarioStack extends cdk.Stack {
  public readonly vehiculosTable: dynamodb.Table;
  public readonly fotosBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // PK = vehiculoId (UUID). GSI por VIN para detectar duplicados.
    this.vehiculosTable = new dynamodb.Table(this, 'VehiculosTable', {
      partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.vehiculosTable.addGlobalSecondaryIndex({
      indexName: 'vin-index',
      partitionKey: { name: 'vin', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Bucket privado. Las imágenes se suben/leen con URLs prefirmadas generadas
    // por el backend, por lo que el bucket permanece cerrado al público.
    this.fotosBucket = new s3.Bucket(this, 'FotosVehiculosBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          // En desarrollo el frontend corre en localhost (Vite).
          // En producción el frontend está en Vercel y sube con URLs prefirmadas desde el navegador.
          allowedOrigins: [
            'http://localhost:5173',
            'https://concesionaria-bmw-app.vercel.app',
            'https://*.vercel.app',
          ],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD, s3.HttpMethods.POST],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    // ------------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------------
    new cdk.CfnOutput(this, 'VehiculosTableName', {
      value: this.vehiculosTable.tableName,
      description: 'Nombre de la tabla DynamoDB de vehículos (backend/.env)',
    });
    new cdk.CfnOutput(this, 'FotosBucketName', {
      value: this.fotosBucket.bucketName,
      description: 'Nombre del bucket S3 de fotografías (backend/.env)',
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Región AWS desplegada',
    });
  }
}
