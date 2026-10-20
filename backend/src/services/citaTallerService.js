const { NotFoundError, ConflictError } = require('../errors/AppError');
const citaTallerRepository = require('../repositories/citaTallerRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const notificacionService = require('./notificacionService');
const { registrarSinFallo } = notificacionService;
const { DURACION_DEFECTO, TIPOS_SERVICIO } = require('../validation/citaTallerSchemas');

/** Citas que ocupan un horario del taller (aún no finalizadas ni canceladas). */
const ESTADOS_CITA_OCUPADOS = ['solicitada', 'confirmada', 'en_atencion'];

const ES_ESTADO_OCUPADO = new Set(ESTADOS_CITA_OCUPADOS);

function autorNombre(actor) {
  return actor?.name || actor?.email || null;
}

function finDe(cita) {
  return new Date(cita.fechaHora).getTime() + Number(cita.duracionMinutos) * 60000;
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

/** Impide que dos citas del mismo vehículo se solapen en el tiempo. */
async function assertSinConflicto(vehiculoId, fechaHora, duracionMinutos, citaIdExcluir) {
  const ocupadas = (await citaTallerRepository.findByVehiculo(vehiculoId)).filter(
    (cita) =>
      ES_ESTADO_OCUPADO.has(cita.estado) &&
      cita.citaId !== citaIdExcluir &&
      haySolape(cita, fechaHora, duracionMinutos)
  );

  if (ocupadas.length > 0) {
    const conflicto = ocupadas[0];
    throw new ConflictError(
      `El vehículo ya tiene una cita el ${formatoFecha(conflicto.fechaHora)} (${conflicto.numero}). Elige otro horario.`
    );
  }
}

/**
 * Cualquier vehículo del inventario puede ir al taller (a diferencia de las
 * pruebas de manejo, un vehículo ya vendido también recibe servicio).
 */
async function resolverVehiculo(vehiculoId) {
  const vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo) throw new NotFoundError('El vehículo no existe.');
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

function tipoServicioEtiqueta(tipo) {
  return TIPOS_SERVICIO.includes(tipo) ? tipo.replace('_', ' ') : tipo;
}

async function createCita(datos, actor) {
  const vehiculo = await resolverVehiculo(datos.vehiculoId);
  const duracion = datos.duracionMinutos ?? DURACION_DEFECTO;

  await assertSinConflicto(vehiculo.vehiculoId, datos.fechaHora, duracion);

  const cliente = await clienteComercialRepository.findById(datos.clienteId);
  if (!cliente) throw new NotFoundError('El cliente comercial no existe.');

  const creadaEn = new Date().toISOString();
  const anio = new Date(creadaEn).getFullYear();
  const secuencia = await citaTallerRepository.siguienteSecuencia(anio);
  const numero = `CIT-${anio}-${String(secuencia).padStart(6, '0')}`;

  const creada = await citaTallerRepository.save({
    numero,
    vehiculoId: vehiculo.vehiculoId,
    vehiculo: resumenVehiculo(vehiculo),
    clienteId: cliente.clienteId,
    cliente: resumenCliente(cliente),
    tipoServicio: datos.tipoServicio,
    fechaHora: datos.fechaHora,
    duracionMinutos: duracion,
    estado: 'solicitada',
    observaciones: datos.observaciones,
    historial: [{ estado: 'solicitada', fecha: creadaEn, usuario: autorNombre(actor) }],
    createdBy: actor?.sub ?? null,
    createdByName: autorNombre(actor),
    createdAt: creadaEn,
    updatedAt: creadaEn,
  });

  await registrarSinFallo(() => notificacionService.notificarCita(creada, 'cita_solicitada'));
  return creada;
}

async function listCitas({ clienteId, vehiculoId, estado, fechaDesde, fechaHasta } = {}) {
  let citas;
  if (clienteId) citas = await citaTallerRepository.findByCliente(clienteId);
  else if (vehiculoId) citas = await citaTallerRepository.findByVehiculo(vehiculoId);
  else citas = await citaTallerRepository.listAll();

  const filtradas = citas.filter(
    (cita) =>
      (!estado || cita.estado === estado) &&
      (!fechaDesde || cita.fechaHora >= fechaDesde) &&
      (!fechaHasta || cita.fechaHora <= fechaHasta)
  );
  return filtradas.sort((a, b) => String(a.fechaHora ?? '').localeCompare(String(b.fechaHora ?? '')));
}

async function getCita(citaId) {
  const cita = await citaTallerRepository.findById(citaId);
  if (!cita) throw new NotFoundError('La cita del taller no existe.');
  return cita;
}

function assertEstado(cita, permitidos, accion) {
  if (!permitidos.includes(cita.estado)) {
    throw new ConflictError(
      `Solo se puede ${accion} una cita ${permitidos.join(' o ')} (estado actual: ${cita.estado}).`
    );
  }
}

function entradaHistorial(estado, actor, extras = {}) {
  return { estado, fecha: new Date().toISOString(), usuario: autorNombre(actor), ...extras };
}

async function confirmarCita(citaId, datos = {}, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ['solicitada'], 'confirmar');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'confirmada',
    observaciones: datos.observaciones ?? cita.observaciones,
    historial: [...(cita.historial ?? []), entradaHistorial('confirmada', actor)],
  });

  await registrarSinFallo(() => notificacionService.notificarCita(actualizada, 'cita_confirmada'));
  return actualizada;
}

async function reprogramarCita(citaId, datos, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ['solicitada', 'confirmada'], 'reprogramar');

  const duracion = datos.duracionMinutos ?? cita.duracionMinutos;
  await assertSinConflicto(cita.vehiculoId, datos.fechaHora, duracion, citaId);

  const actualizada = await citaTallerRepository.update(citaId, {
    fechaHora: datos.fechaHora,
    duracionMinutos: duracion,
    observaciones: datos.observaciones ?? cita.observaciones,
    historial: [
      ...(cita.historial ?? []),
      entradaHistorial(cita.estado, actor, { motivo: `Reprogramada a ${formatoFecha(datos.fechaHora)}` }),
    ],
  });

  await registrarSinFallo(() => notificacionService.notificarCita(actualizada, 'cita_reprogramada'));
  return actualizada;
}

async function iniciarCita(citaId, datos = {}, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ['confirmada'], 'iniciar la atención de');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'en_atencion',
    observaciones: datos.observaciones ?? cita.observaciones,
    historial: [
      ...(cita.historial ?? []),
      entradaHistorial('en_atencion', actor, datos.observaciones ? { observaciones: datos.observaciones } : {}),
    ],
  });

  return actualizada;
}

async function finalizarCita(citaId, datos = {}, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ['en_atencion'], 'finalizar');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'finalizada',
    observaciones: datos.observaciones ?? cita.observaciones,
    historial: [
      ...(cita.historial ?? []),
      entradaHistorial('finalizada', actor, datos.observaciones ? { observaciones: datos.observaciones } : {}),
    ],
  });

  await registrarSinFallo(() => notificacionService.notificarCita(actualizada, 'cita_finalizada'));
  return actualizada;
}

async function cancelarCita(citaId, datos = {}, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ['solicitada', 'confirmada'], 'cancelar');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'cancelada',
    historial: [
      ...(cita.historial ?? []),
      entradaHistorial('cancelada', actor, datos.motivo ? { motivo: datos.motivo } : {}),
    ],
  });

  await registrarSinFallo(() => notificacionService.notificarCita(actualizada, 'cita_cancelada'));
  return actualizada;
}

module.exports = {
  ESTADOS_CITA_OCUPADOS,
  tipoServicioEtiqueta,
  createCita,
  listCitas,
  getCita,
  confirmarCita,
  reprogramarCita,
  iniciarCita,
  finalizarCita,
  cancelarCita,
};
