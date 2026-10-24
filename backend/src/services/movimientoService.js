const { randomUUID } = require('crypto');

const repuestoRepository = require('../repositories/repuestoRepository');
const movimientoRepository = require('../repositories/movimientoRepository');
const repuestoService = require('../services/repuestoService');
const { ConflictError, NotFoundError } = require('../errors/AppError');

/**
 * Registra una entrada o salida de existencias.
 * La salida se rechaza si supera las existencias disponibles (control atómico
 * en DynamoDB) y, en todos los casos, queda un movimiento en el historial.
 */
async function registrarMovimiento(input, actor) {
  const repuesto = await repuestoRepository.findById(input.repuestoId);
  if (!repuesto) {
    throw new NotFoundError('El repuesto no existe.');
  }

  const delta = input.tipo === 'entrada' ? input.cantidad : -input.cantidad;

  let actualizado;
  try {
    actualizado = await repuestoRepository.adjustStock(repuesto.repuestoId, delta);
  } catch (error) {
    if (error?.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('No hay existencias suficientes para registrar esa salida.');
    }
    throw error;
  }

  const ahora = new Date().toISOString();
  const movimiento = {
    movimientoId: randomUUID(),
    repuestoId: repuesto.repuestoId,
    repuestoCodigo: repuesto.codigo,
    repuestoNombre: repuesto.nombre,
    tipo: input.tipo,
    cantidad: input.cantidad,
    cantidadResultante: actualizado?.cantidad ?? (repuesto.cantidad ?? 0) + delta,
    motivo: input.motivo ?? '',
    createdAt: ahora,
    usuarioId: actor?.sub ?? null,
    usuarioNombre: actor?.name || actor?.email || null,
  };

  const guardado = await movimientoRepository.save(movimiento);

  return { movimiento: guardado, repuesto: repuestoService.toResponse(actualizado) };
}

/** Lista los movimientos, opcionalmente filtrados por repuesto y/o tipo. */
async function listMovimientos({ repuestoId, tipo } = {}) {
  const movimientos = repuestoId
    ? await movimientoRepository.listByRepuesto(repuestoId)
    : await movimientoRepository.listAll();

  const filtrados = tipo ? movimientos.filter((movimiento) => movimiento.tipo === tipo) : movimientos;

  return [...filtrados].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
}

module.exports = { registrarMovimiento, listMovimientos };
