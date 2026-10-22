const { PutCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const { documentClient } = require('../db/dynamodb');
const { config } = require('../config');
const { v4: uuidv4 } = require('uuid');

const tableName = config.auditoriaTableName;

class AuditoriaRepository {
  /** Registra un evento de auditoría (inmutable). */
  async crear(evento) {
    const item = {
      eventoId: evento.eventoId || uuidv4(),
      fecha: evento.fecha,
      fechaHora: evento.fechaHora,
      usuarioId: evento.usuarioId || 'anonimo',
      usuarioNombre: evento.usuarioNombre || 'Anónimo',
      usuarioEmail: evento.usuarioEmail || null,
      roles: evento.roles || [],
      accion: evento.accion,
      tipo: evento.tipo,
      recursoTipo: evento.recursoTipo || null,
      recursoId: evento.recursoId || null,
      recursoTipoId: evento.recursoTipoId || `${evento.recursoTipo || 'general'}#${evento.recursoId || 'global'}`,
      descripcion: evento.descripcion || '',
      ip: evento.ip || null,
      userAgent: evento.userAgent || null,
      metadata: evento.metadata || {},
      createdAt: evento.createdAt || new Date().toISOString(),
    };

    await documentClient.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  }

  /** Lista todos los eventos. */
  async listAll() {
    const result = await documentClient.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  }

  /** Busca por usuarioId usando el GSI usuario-index. */
  async findByUsuario(usuarioId) {
    const result = await documentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'usuario-index',
        KeyConditionExpression: 'usuarioId = :usuarioId',
        ExpressionAttributeValues: { ':usuarioId': usuarioId },
      })
    );
    return result.Items || [];
  }

  /** Busca por tipo usando el GSI tipo-index. */
  async findByTipo(tipo) {
    const result = await documentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'tipo-index',
        KeyConditionExpression: 'tipo = :tipo',
        ExpressionAttributeValues: { ':tipo': tipo },
      })
    );
    return result.Items || [];
  }

  /** Busca por recurso (recursoTipo#recursoId) usando el GSI recurso-index. */
  async findByRecurso(recursoTipoId) {
    const result = await documentClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'recurso-index',
        KeyConditionExpression: 'recursoTipoId = :recursoTipoId',
        ExpressionAttributeValues: { ':recursoTipoId': recursoTipoId },
      })
    );
    return result.Items || [];
  }
}

module.exports = new AuditoriaRepository();
module.exports.AuditoriaRepository = AuditoriaRepository;
