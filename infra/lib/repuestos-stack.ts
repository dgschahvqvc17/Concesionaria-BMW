import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * HU04 - Gestionar el inventario de repuestos.
 * Tabla DynamoDB `Repuestos` (con índice por código para evitar duplicados y
 * permitir búsquedas) y tabla `MovimientosInventario` que registra cada entrada
 * o salida de existencias (con índice por repuesto para consultar su historial).
 */
export class RepuestosStack extends cdk.Stack {
  public readonly repuestosTable: dynamodb.Table;
  public readonly movimientosTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // PK = repuestoId (UUID). GSI por código para detectar duplicados y buscar.
    this.repuestosTable = new dynamodb.Table(this, 'RepuestosTable', {
      partitionKey: { name: 'repuestoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.repuestosTable.addGlobalSecondaryIndex({
      indexName: 'codigo-index',
      partitionKey: { name: 'codigo', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // PK = movimientoId (UUID). GSI por repuestoId + createdAt (historial).
    this.movimientosTable = new dynamodb.Table(this, 'MovimientosTable', {
      partitionKey: { name: 'movimientoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.movimientosTable.addGlobalSecondaryIndex({
      indexName: 'repuesto-index',
      partitionKey: { name: 'repuestoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ------------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------------
    new cdk.CfnOutput(this, 'RepuestosTableName', {
      value: this.repuestosTable.tableName,
      description: 'Nombre de la tabla DynamoDB de repuestos (backend/.env)',
    });
    new cdk.CfnOutput(this, 'MovimientosTableName', {
      value: this.movimientosTable.tableName,
      description: 'Nombre de la tabla DynamoDB de movimientos de inventario (backend/.env)',
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Región AWS desplegada',
    });
  }
}
