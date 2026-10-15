const { randomUUID } = require('crypto');

const vehiculoRepository = require('../repositories/vehiculoRepository');
const storageService = require('../services/storageService');
const { ConflictError, NotFoundError } = require('../errors/AppError');

const ESTADO_DISPONIBLE = 'disponible';

/** Convierte las claves de fotos almacenadas en URLs prefirmadas para el frontend. */
async function toResponse(vehiculo) {
  const fotos = vehiculo.fotos ?? [];
  return { ...vehiculo, fotos: await storageService.withViewUrls(fotos) };
}

/**
 * Proyección pública de un vehículo para el catálogo web (HU05).
 * Omite datos internos (VIN, autoría) y expone solo lo que ve el cliente.
 */
async function toCatalogoResponse(vehiculo) {
  const fotos = vehiculo.fotos ?? [];
  return {
    vehiculoId: vehiculo.vehiculoId,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio,
    version: vehiculo.version,
    kilometraje: vehiculo.kilometraje,
    precio: vehiculo.precio,
    color: vehiculo.color,
    condicion: vehiculo.condicion,
    tipo: vehiculo.tipo ?? 'otros',
    estado: vehiculo.estado,
    descripcion: vehiculo.descripcion ?? '',
    caracteristicas: vehiculo.caracteristicas ?? [],
    fotos: await storageService.withViewUrls(fotos),
    createdAt: vehiculo.createdAt,
  };
}

/** Indica si un vehículo debe mostrarse en el catálogo público. */
function esPublicado(vehiculo) {
  return vehiculo.publicado !== false;
}

/** Registra un vehículo nuevo validando que el VIN no esté duplicado. */
async function createVehiculo(input, actor) {
  const existente = await vehiculoRepository.findByVin(input.vin);
  if (existente) {
    throw new ConflictError('Ya existe un vehículo registrado con ese VIN.');
  }

  const ahora = new Date().toISOString();
  const vehiculo = {
    vehiculoId: randomUUID(),
    marca: input.marca,
    modelo: input.modelo,
    anio: input.anio,
    version: input.version,
    kilometraje: input.kilometraje,
    precio: input.precio,
    color: input.color,
    vin: input.vin,
    condicion: input.condicion,
    tipo: input.tipo,
    estado: input.estado ?? ESTADO_DISPONIBLE,
    descripcion: input.descripcion ?? '',
    caracteristicas: input.caracteristicas ?? [],
    publicado: input.publicado ?? true,
    fotos: input.fotos ?? [],
    createdAt: ahora,
    updatedAt: ahora,
    createdBy: actor?.sub ?? null,
    updatedBy: actor?.sub ?? null,
  };

  const guardado = await vehiculoRepository.save(vehiculo);
  return toResponse(guardado);
}

/** Actualiza los datos de un vehículo, validando el VIN si cambia. */
async function updateVehiculo(vehiculoId, changes, actor) {
  const actual = await vehiculoRepository.findById(vehiculoId);
  if (!actual) {
    throw new NotFoundError('El vehículo no existe.');
  }

  if (changes.vin && changes.vin !== actual.vin) {
    const existente = await vehiculoRepository.findByVin(changes.vin);
    if (existente && existente.vehiculoId !== vehiculoId) {
      throw new ConflictError('Ya existe otro vehículo registrado con ese VIN.');
    }
  }

  const actualizado = {
    ...actual,
    ...changes,
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.sub ?? null,
  };

  const guardado = await vehiculoRepository.save(actualizado);
  return toResponse(guardado);
}

/** Lista los vehículos, del más reciente al más antiguo. */
async function listVehiculos() {
  const vehiculos = await vehiculoRepository.listAll();
  const ordenados = [...vehiculos].sort((a, b) =>
    String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  );
  return Promise.all(ordenados.map(toResponse));
}

/** Obtiene un vehículo por su identificador. */
async function getVehiculo(vehiculoId) {
  const vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo) {
    throw new NotFoundError('El vehículo no existe.');
  }
  return toResponse(vehiculo);
}

/** Genera una URL prefirmada para subir una fotografía. */
function createFotoUploadUrl(payload) {
  return storageService.createUploadUrl(payload);
}

/** Lista los vehículos publicados en el catálogo web (HU05). */
async function listCatalogo() {
  const vehiculos = await vehiculoRepository.listAll();
  const publicados = vehiculos
    .filter(esPublicado)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  return Promise.all(publicados.map(toCatalogoResponse));
}

/** Obtiene un vehículo publicado por su identificador para el catálogo web (HU05). */
async function getCatalogoVehiculo(vehiculoId) {
  const vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo || vehiculo.publicado === false) {
    throw new NotFoundError('El vehículo no está disponible en el catálogo.');
  }
  return toCatalogoResponse(vehiculo);
}

module.exports = {
  createVehiculo,
  updateVehiculo,
  listVehiculos,
  getVehiculo,
  listCatalogo,
  getCatalogoVehiculo,
  createFotoUploadUrl,
};
