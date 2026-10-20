const { NotFoundError, ConflictError } = require('../errors/AppError');
const pruebaManejoRepository = require('../repositories/pruebaManejoRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const { DURACION_DEFECTO } = require('../validation/pruebaManejoSchemas');

/** Estados del vehículo que permiten agendar una prueba de manejo (HU11). */
const ESTADOS_VEHICULO_PRUEBA = ['disponible', 'reservado'];
/** Pruebas que ocupan un horario (pendientes o confirmadas). */
const ESTADOS_PRUEBA_OCUPADOS = ['pendiente', 'confirmada'];

const ES_ESTADO_OCUPADO = new Set(ESTADOS_PRUEBA_OCUPADOS);

function esStaff(roles = []) {
  return roles.some((rol) => rol === 'admin' || rol === 'vendedor');
}

function autorNombre(actor) {
  return actor?.name || actor?.email || null;
}

function finDe(prueba) {
  return new Date(prueba.fechaHora).getTime() + Number(prueba.duracionMinutos) * 60000;
}

function haySolape(otra, fechaHora, duracionMinutos) {
  const inicioNuevo = new Date(fechaHora).getTime();
  const finNuevo = inicioNuevo + duracionMinutos * 60000;
  const inicioOtra = new Date(otra.fechaHora).getTime();
  return inicioNuevo < finDe(otra) && inicioOtra < finNuevo;
}

function formatoFecha(iso) {
  return String(iso).replace('T', ' ').slice(0, 16);
}

/** Impide que dos pruebas del mismo vehículo se solapen en el tiempo. */
async function assertSinConflicto(vehiculoId, fechaHora, duracionMinutos, pruebaIdExcluir) {
  const ocupadas = (await pruebaManejoRepository.findByVehiculo(vehiculoId)).filter(
    (prueba) =>
      ES_ESTADO_OCUPADO.has(prueba.estado) &&
      prueba.pruebaId !== pruebaIdExcluir &&
      haySolape(prueba, fechaHora, duracionMinutos)
  );

  if (ocupadas.length > 0) {
    const conflicto = ocupadas[0];
    throw new ConflictError(
      `El vehículo ya tiene una prueba el ${formatoFecha(conflicto.fechaHora)} (${conflicto.numero}). Elige otro horario.`
    );
  }
}

async function resolverVehiculoPrueba(vehiculoId) {
  const vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo) throw new NotFoundError('El vehículo no existe.');
  if (vehiculo.publicado === false) {
    throw new ConflictError('El vehículo no está publicado para agendar pruebas de manejo.');
  }
  if (!ESTADOS_VEHICULO_PRUEBA.includes(vehiculo.estado)) {
    throw new ConflictError(`El vehículo no está disponible para pruebas de manejo (estado: ${vehiculo.estado}).`);
  }
  return vehiculo;
}

function resumenVehiculo(vehiculo) {
  return {
    vehiculoId: vehiculo.vehiculoId,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    version: vehiculo.version,
    anio: vehiculo.anio,
    precio: vehiculo.precio,
    color: vehiculo.color,
  };
}

function resumenCliente(cliente) {
  return {
    clienteId: cliente.clienteId,
    nombres: cliente.nombres,
    apellidos: cliente.apellidos,
    email: cliente.email,
    telefono: cliente.telefono,
  };
}

async function createPrueba(datos, actor, roles = []) {
  const vehiculo = await resolverVehiculoPrueba(datos.vehiculoId);
  const duracion = datos.duracionMinutos ?? DURACION_DEFECTO;

  await assertSinConflicto(vehiculo.vehiculoId, datos.fechaHora, duracion);

  const cliente = datos.clienteId && esStaff(roles)
    ? await clienteComercialRepository.findById(datos.clienteId)
    : null;
  if (datos.clienteId && esStaff(roles) && !cliente) {
    throw new NotFoundError('El cliente comercial no existe.');
  }

  const creadaEn = new Date().toISOString();
  const anio = new Date(creadaEn).getFullYear();
  const secuencia = await pruebaManejoRepository.siguienteSecuencia(anio);
  const numero = `PRB-${anio}-${String(secuencia).padStart(6, '0')}`;

  return pruebaManejoRepository.save({
    numero,
    vehiculoId: vehiculo.vehiculoId,
    vehiculo: resumenVehiculo(vehiculo),
    clienteId: cliente?.clienteId ?? 'anonimo',
    cliente: cliente ? resumenCliente(cliente) : null,
    contacto: datos.contacto,
    fechaHora: datos.fechaHora,
    duracionMinutos: duracion,
    estado: 'pendiente',
    origen: esStaff(roles) ? 'interno' : actor?.sub ? 'cliente' : 'catalogo',
    observaciones: datos.observaciones,
    historial: [{ estado: 'pendiente', fecha: creadaEn, usuario: autorNombre(actor) }],
    createdBy: actor?.sub ?? null,
    createdByName: autorNombre(actor),
    createdAt: creadaEn,
    updatedAt: creadaEn,
  });
}

async function listPruebas({ clienteId, vehiculoId, estado } = {}) {
  let pruebas;
  if (clienteId) pruebas = await pruebaManejoRepository.findByCliente(clienteId);
  else if (vehiculoId) pruebas = await pruebaManejoRepository.findByVehiculo(vehiculoId);
  else pruebas = await pruebaManejoRepository.listAll();

  const filtradas = estado ? pruebas.filter((prueba) => prueba.estado === estado) : pruebas;
  return filtradas.sort((a, b) => String(a.fechaHora ?? '').localeCompare(String(b.fechaHora ?? '')));
}

async function getPrueba(pruebaId) {
  const prueba = await pruebaManejoRepository.findById(pruebaId);
  if (!prueba) throw new NotFoundError('La prueba de manejo no existe.');
  return prueba;
}

function assertEstado(prueba, permitidos, accion) {
  if (!permitidos.includes(prueba.estado)) {
    throw new ConflictError(
      `Solo se puede ${accion} una prueba ${permitidos.join(' o ')} (estado actual: ${prueba.estado}).`
    );
  }
}

function entradaHistorial(estado, actor, extras = {}) {
  return { estado, fecha: new Date().toISOString(), usuario: autorNombre(actor), ...extras };
}

async function confirmarPrueba(pruebaId, datos = {}, actor = {}) {
  const prueba = await getPrueba(pruebaId);
  assertEstado(prueba, ['pendiente'], 'confirmar');

  return pruebaManejoRepository.update(pruebaId, {
    estado: 'confirmada',
    observaciones: datos.observaciones ?? prueba.observaciones,
    historial: [...(prueba.historial ?? []), entradaHistorial('confirmada', actor)],
  });
}

async function reprogramarPrueba(pruebaId, datos, actor = {}) {
  const prueba = await getPrueba(pruebaId);
  assertEstado(prueba, ESTADOS_PRUEBA_OCUPADOS, 'reprogramar');

  const duracion = datos.duracionMinutos ?? prueba.duracionMinutos;
  await assertSinConflicto(prueba.vehiculoId, datos.fechaHora, duracion, pruebaId);

  return pruebaManejoRepository.update(pruebaId, {
    fechaHora: datos.fechaHora,
    duracionMinutos: duracion,
    observaciones: datos.observaciones ?? prueba.observaciones,
    historial: [
      ...(prueba.historial ?? []),
      entradaHistorial(prueba.estado, actor, { motivo: `Reprogramada a ${formatoFecha(datos.fechaHora)}` }),
    ],
  });
}

async function cancelarPrueba(pruebaId, datos = {}, actor = {}) {
  const prueba = await getPrueba(pruebaId);
  assertEstado(prueba, ESTADOS_PRUEBA_OCUPADOS, 'cancelar');

  return pruebaManejoRepository.update(pruebaId, {
    estado: 'cancelada',
    historial: [
      ...(prueba.historial ?? []),
      entradaHistorial('cancelada', actor, datos.motivo ? { motivo: datos.motivo } : {}),
    ],
  });
}

async function realizarPrueba(pruebaId, datos = {}, actor = {}) {
  const prueba = await getPrueba(pruebaId);
  assertEstado(prueba, ['confirmada'], 'realizar');

  return pruebaManejoRepository.update(pruebaId, {
    estado: 'realizada',
    observaciones: datos.observaciones ?? prueba.observaciones,
    historial: [
      ...(prueba.historial ?? []),
      entradaHistorial('realizada', actor, datos.observaciones ? { observaciones: datos.observaciones } : {}),
    ],
  });
}

module.exports = {
  createPrueba,
  listPruebas,
  getPrueba,
  confirmarPrueba,
  reprogramarPrueba,
  cancelarPrueba,
  realizarPrueba,
};
