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
    estado: input.estado ?? ESTADO_DISPONIBLE,
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

module.exports = {
  createVehiculo,
  updateVehiculo,
  listVehiculos,
  getVehiculo,
  createFotoUploadUrl,
};
