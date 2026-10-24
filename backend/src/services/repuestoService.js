const { randomUUID } = require('crypto');

const repuestoRepository = require('../repositories/repuestoRepository');
const { ConflictError, NotFoundError } = require('../errors/AppError');

/** Serializa un repuesto agregando la marca de reposición requerida. */
function toResponse(repuesto) {
  if (!repuesto) return null;
  const cantidad = repuesto.cantidad ?? 0;
  const cantidadMinima = repuesto.cantidadMinima ?? 0;
  return {
    ...repuesto,
    cantidad,
    cantidadMinima,
    requiereReposicion: cantidad <= cantidadMinima,
  };
}

/** Registra un repuesto nuevo validando que el código no esté duplicado. */
async function createRepuesto(input, actor) {
  const existente = await repuestoRepository.findByCodigo(input.codigo);
  if (existente) {
    throw new ConflictError('Ya existe un repuesto registrado con ese código.');
  }

  const ahora = new Date().toISOString();
  const repuesto = {
    repuestoId: randomUUID(),
    codigo: input.codigo,
    nombre: input.nombre,
    descripcion: input.descripcion ?? '',
    precio: input.precio,
    cantidad: input.cantidad,
    cantidadMinima: input.cantidadMinima ?? 0,
    createdAt: ahora,
    updatedAt: ahora,
    createdBy: actor?.sub ?? null,
    updatedBy: actor?.sub ?? null,
  };

  const guardado = await repuestoRepository.save(repuesto);
  return toResponse(guardado);
}

/** Actualiza los datos de un repuesto, validando el código si cambia. */
async function updateRepuesto(repuestoId, changes, actor) {
  const actual = await repuestoRepository.findById(repuestoId);
  if (!actual) {
    throw new NotFoundError('El repuesto no existe.');
  }

  if (changes.codigo && changes.codigo !== actual.codigo) {
    const existente = await repuestoRepository.findByCodigo(changes.codigo);
    if (existente && existente.repuestoId !== repuestoId) {
      throw new ConflictError('Ya existe otro repuesto registrado con ese código.');
    }
  }

  const actualizado = {
    ...actual,
    ...changes,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.sub ?? null,
  };

  const guardado = await repuestoRepository.save(actualizado);
  return toResponse(guardado);
}

/** Lista los repuestos ordenados por código. */
async function listRepuestos() {
  const repuestos = await repuestoRepository.listAll();
  const ordenados = [...repuestos].sort((a, b) =>
    String(a.codigo ?? '').localeCompare(String(b.codigo ?? ''), 'es')
  );
  return ordenados.map(toResponse);
}

/** Obtiene un repuesto por su identificador. */
async function getRepuesto(repuestoId) {
  const repuesto = await repuestoRepository.findById(repuestoId);
  if (!repuesto) {
    throw new NotFoundError('El repuesto no existe.');
  }
  return toResponse(repuesto);
}

module.exports = {
  toResponse,
  createRepuesto,
  updateRepuesto,
  listRepuestos,
  getRepuesto,
};
