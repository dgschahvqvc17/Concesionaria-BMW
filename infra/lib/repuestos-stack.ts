import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * HU04 - Gestionar el inventario de repuestos.
 * Tabla DynamoDB `Repuestos` (con índice por código para evitar duplicados y
 * permitir búsquedas) y tabla `MovimientosInventario` que registra cada entrada
 * o salida de existencias (con índice por repuesto para consultar su historial).
 *
 * HU07 - Seguimiento comercial: tabla `ClientesComerciales` (índices por email y
 * documento para búsqueda y anti-duplicados).
 *
 * HU08 - Cotizaciones: tabla `Cotizaciones` (índices por cliente para el historial
 * y por número de cotización).
 *
 * HU09 - Reservas: tabla `Reservas` (índices por vehículo para detectar reservas
 * activas, por cliente para el historial y por número de reserva).
 *
 * HU10 - Ventas: tabla `Ventas` (índices por vehículo, por cliente y por número
 * de operación para el historial de ventas).
 *
 * HU11 - Pruebas de manejo: tabla `PruebasManejo` (índice por vehículo + fecha
 * para detectar conflictos de horario, por cliente para el historial y por
 * número de solicitud).
 *
 * HU12 - Notificaciones: tabla `Notificaciones` (PK = eventoId, clave única por
 * evento + destinatario para evitar envíos duplicados; índice por recurso para
 * consultar el historial de correos de una operación).
 */
export class RepuestosStack extends cdk.Stack {
  public readonly repuestosTable: dynamodb.Table;
  public readonly movimientosTable: dynamodb.Table;
  public readonly clientesComercialesTable: dynamodb.Table;
  public readonly cotizacionesTable: dynamodb.Table;
  public readonly reservasTable: dynamodb.Table;
  public readonly ventasTable: dynamodb.Table;
  public readonly pruebasManejoTable: dynamodb.Table;
  public readonly notificacionesTable: dynamodb.Table;

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

    // HU07: Clientes comerciales
    this.clientesComercialesTable = new dynamodb.Table(this, 'ClientesComercialesTable', {
      partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.clientesComercialesTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.clientesComercialesTable.addGlobalSecondaryIndex({
      indexName: 'documento-index',
      partitionKey: { name: 'documento', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // HU08: Cotizaciones. PK = cotizacionId (UUID). GSI por cliente + createdAt
    // (historial de cotizaciones del cliente) y GSI por número (número único).
    this.cotizacionesTable = new dynamodb.Table(this, 'CotizacionesTable', {
      partitionKey: { name: 'cotizacionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.cotizacionesTable.addGlobalSecondaryIndex({
      indexName: 'cliente-index',
      partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.cotizacionesTable.addGlobalSecondaryIndex({
      indexName: 'numero-index',
      partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // HU09: Reservas. PK = reservaId (UUID). GSI por vehículo + createdAt (para
    // detectar reservas activas de una unidad), GSI por cliente + createdAt
    // (historial del cliente) y GSI por número (número único).
    this.reservasTable = new dynamodb.Table(this, 'ReservasTable', {
      partitionKey: { name: 'reservaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.reservasTable.addGlobalSecondaryIndex({
      indexName: 'vehiculo-index',
      partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.reservasTable.addGlobalSecondaryIndex({
      indexName: 'cliente-index',
      partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.reservasTable.addGlobalSecondaryIndex({
      indexName: 'numero-index',
      partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // HU10: Ventas. PK = ventaId (UUID). GSI por cliente, por vehículo (control de que
    // una unidad solo se vendió una vez) y por número (número único).
    this.ventasTable = new dynamodb.Table(this, 'VentasTable', {
      partitionKey: { name: 'ventaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.ventasTable.addGlobalSecondaryIndex({
      indexName: 'cliente-index',
      partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.ventasTable.addGlobalSecondaryIndex({
      indexName: 'vehiculo-index',
      partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.ventasTable.addGlobalSecondaryIndex({
      indexName: 'numero-index',
      partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // HU11: Pruebas de manejo. PK = pruebaId (UUID). GSI por vehículo + fechaHora
    // para consultar los solapes de horario de una unidad, GSI por cliente
    // (historial; "anonimo" para solicitudes públicas) y GSI por número.
    this.pruebasManejoTable = new dynamodb.Table(this, 'PruebasManejoTable', {
      partitionKey: { name: 'pruebaId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.pruebasManejoTable.addGlobalSecondaryIndex({
      indexName: 'vehiculo-index',
      partitionKey: { name: 'vehiculoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fechaHora', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.pruebasManejoTable.addGlobalSecondaryIndex({
      indexName: 'cliente-index',
      partitionKey: { name: 'clienteId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.pruebasManejoTable.addGlobalSecondaryIndex({
      indexName: 'numero-index',
      partitionKey: { name: 'numero', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // HU12: Notificaciones. PK = eventoId (clave única por evento + destinatario;
    // el Put condicional impide el envío duplicado de un mismo evento). GSI por
    // recurso + createdAt para ver el historial de correos de una operación.
    this.notificacionesTable = new dynamodb.Table(this, 'NotificacionesTable', {
      partitionKey: { name: 'eventoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.notificacionesTable.addGlobalSecondaryIndex({
      indexName: 'recurso-index',
      partitionKey: { name: 'recursoId', type: dynamodb.AttributeType.STRING },
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
    new cdk.CfnOutput(this, 'ClientesComercialesTableName', {
      value: this.clientesComercialesTable.tableName,
      description: 'Nombre de la tabla DynamoDB de clientes comerciales (backend/.env)',
    });
    new cdk.CfnOutput(this, 'CotizacionesTableName', {
      value: this.cotizacionesTable.tableName,
      description: 'Nombre de la tabla DynamoDB de cotizaciones (backend/.env)',
    });
    new cdk.CfnOutput(this, 'ReservasTableName', {
      value: this.reservasTable.tableName,
      description: 'Nombre de la tabla DynamoDB de reservas (backend/.env)',
    });
    new cdk.CfnOutput(this, 'VentasTableName', {
      value: this.ventasTable.tableName,
      description: 'Nombre de la tabla DynamoDB de ventas (backend/.env)',
    });
    new cdk.CfnOutput(this, 'PruebasManejoTableName', {
      value: this.pruebasManejoTable.tableName,
      description: 'Nombre de la tabla DynamoDB de pruebas de manejo (backend/.env)',
    });
    new cdk.CfnOutput(this, 'NotificacionesTableName', {
      value: this.notificacionesTable.tableName,
      description: 'Nombre de la tabla DynamoDB de notificaciones (backend/.env)',
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Región AWS desplegada',
    });
  }
}
