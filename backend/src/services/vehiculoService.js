const { randomUUID } = require('crypto');

const vehiculoRepository = require('../repositories/vehiculoRepository');
const storageService = require('../services/storageService');
const { ConflictError, NotFoundError } = require('../errors/AppError');

const ESTADO_DISPONIBLE = 'disponible';

/**
 * Normaliza el stock para registros antiguos que aún no tienen el atributo.
 * La validación de entrada se hace con Zod; esto solo evita devolver `undefined`
 * o persistir un valor inválido en una actualización.
 */
function normalizarStock(stock) {
  return Number.isInteger(stock) && stock >= 0 ? stock : 0;
}

/** Convierte las claves de archivos almacenadas en URLs prefirmadas para el frontend. */
async function toResponse(vehiculo) {
  const fotos = vehiculo.fotos ?? [];
  const documentos = vehiculo.documentos ?? [];
  return {
    ...vehiculo,
    stock: normalizarStock(vehiculo.stock),
    fotos: await storageService.withViewUrls(fotos),
    documentos: await storageService.withDocumentViewUrls(documentos),
  };
}

/** Comprueba que las fotografías nuevas existan en S3 y cumplan las reglas. */
async function verificarFotosNuevas(fotos, fotosActuales) {
  const nuevas = fotos.filter((key) => !fotosActuales.includes(key));
  for (const key of nuevas) {
    await storageService.assertArchivo(key, 'foto');
  }
}

/**
 * Arma la lista definitiva de documentos: conserva los ya registrados y
 * verifica en S3 los nuevos, guardando su metadata autoritativa (HU06).
 */
async function registrarDocumentos(documentos, documentosActuales, actor, ahora) {
  const actuales = new Map(documentosActuales.map((documento) => [documento.key, documento]));
  const resultado = [];

  for (const documento of documentos) {
    const existente = actuales.get(documento.key);
    if (existente) {
      resultado.push(existente);
      continue;
    }

    const { contentType, size } = await storageService.assertArchivo(documento.key, 'documento');
    resultado.push({
      key: documento.key,
      nombre: documento.nombre,
      contentType,
      size,
      uploadedAt: ahora,
      uploadedBy: actor?.sub ?? null,
    });
  }

  return resultado;
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
  const fotos = input.fotos ?? [];
  await verificarFotosNuevas(fotos, []);
  const documentos = await registrarDocumentos(input.documentos ?? [], [], actor, ahora);

  const vehiculo = {
    vehiculoId: randomUUID(),
    marca: input.marca,
    modelo: input.modelo,
    anio: input.anio,
    version: input.version,
    kilometraje: input.kilometraje,
    stock: normalizarStock(input.stock),
    precio: input.precio,
    color: input.color,
    vin: input.vin,
    condicion: input.condicion,
    tipo: input.tipo,
    estado: input.estado ?? ESTADO_DISPONIBLE,
    descripcion: input.descripcion ?? '',
    caracteristicas: input.caracteristicas ?? [],
    publicado: input.publicado ?? true,
    fotos,
    documentos,
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

  const ahora = new Date().toISOString();
  const fotosActuales = actual.fotos ?? [];
  const documentosActuales = actual.documentos ?? [];
  let fotos = fotosActuales;
  let documentos = documentosActuales;

  if (changes.fotos) {
    await verificarFotosNuevas(changes.fotos, fotosActuales);
    const eliminadas = fotosActuales.filter((key) => !changes.fotos.includes(key));
    await Promise.all(eliminadas.map((key) => storageService.deleteObject(key)));
    fotos = changes.fotos;
  }

  if (changes.documentos) {
    documentos = await registrarDocumentos(changes.documentos, documentosActuales, actor, ahora);
    const vigentes = new Set(documentos.map((documento) => documento.key));
    const eliminados = documentosActuales.filter((documento) => !vigentes.has(documento.key));
    await Promise.all(eliminados.map((documento) => storageService.deleteObject(documento.key)));
  }

  const actualizado = {
    ...actual,
    ...changes,
    stock: normalizarStock(changes.stock ?? actual.stock),
    fotos,
    documentos,
    updatedAt: ahora,
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

/** Genera una URL prefirmada para subir una fotografía o documento (HU06). */
function presignArchivo(payload) {
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
  presignArchivo,
};
