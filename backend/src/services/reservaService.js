const { NotFoundError, ConflictError } = require('../errors/AppError');
const reservaRepository = require('../repositories/reservaRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const { VIGENCIA_DIAS_DEFECTO } = require('../validation/reservaSchemas');

/** La reserva solo puede tomar una unidad disponible (HU09). */
const ESTADO_VEHICULO_RESERVABLE = 'disponible';
const ESTADO_VEHICULO_RESERVADO = 'reservado';
const ESTADO_VEHICULO_VENDIDO = 'vendido';

function calcularFechaVencimiento(desde, dias) {
  const fecha = new Date(desde);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString();
}

/** Indica si una reserva activa ya expiró según su fecha de vencimiento. */
function estaVencida(reserva) {
  return (
    reserva.estado === 'activa' &&
    reserva.fechaVencimiento &&
    new Date(reserva.fechaVencimiento) < new Date()
  );
}

function resumenCliente(cliente) {
  return {
    clienteId: cliente.clienteId,
    nombres: cliente.nombres,
    apellidos: cliente.apellidos,
    documento: cliente.documento,
    email: cliente.email,
    telefono: cliente.telefono,
  };
}

/** Snapshot del vehículo con su precio vigente al momento de reservar. */
function resumenVehiculo(vehiculo) {
  return {
    vehiculoId: vehiculo.vehiculoId,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    version: vehiculo.version,
    anio: vehiculo.anio,
    vin: vehiculo.vin,
    precio: vehiculo.precio,
  };
}

function autorNombre(actor) {
  return actor?.name || actor?.email || null;
}

/** Libera la unidad solo si seguía reservada (evita pisar un estado manual). */
async function liberarVehiculo(vehiculoId) {
  await vehiculoRepository.cambiarEstadoCondicional(
    vehiculoId,
    ESTADO_VEHICULO_RESERVADO,
    ESTADO_VEHICULO_RESERVABLE
  );
}

/** Marca como vencida (derivado) una reserva activa expirada y libera la unidad. */
async function aplicarVencimiento(reserva) {
  if (!estaVencida(reserva)) return reserva;

  const actualizada = await reservaRepository.update(reserva.reservaId, {
    estado: 'vencida',
    historial: [
      ...(reserva.historial ?? []),
      { estado: 'vencida', fecha: new Date().toISOString(), motivo: 'Vencimiento automático' },
    ],
  });

  await liberarVehiculo(reserva.vehiculoId);
  return actualizada;
}

async function listReservas({ clienteId, vehiculoId, estado } = {}) {
  let reservas;
  if (clienteId) reservas = await reservaRepository.findByCliente(clienteId);
  else if (vehiculoId) reservas = await reservaRepository.findByVehiculo(vehiculoId);
  else reservas = await reservaRepository.listAll();

  const normalizadas = [];
  for (const reserva of reservas) {
    normalizadas.push(await aplicarVencimiento(reserva));
  }

  const filtradas = estado ? normalizadas.filter((r) => r.estado === estado) : normalizadas;
  return filtradas.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}

async function getReserva(reservaId) {
  const reserva = await reservaRepository.findById(reservaId);
  if (!reserva) throw new NotFoundError('Reserva no encontrada.');
  return aplicarVencimiento(reserva);
}

async function resolverCliente(clienteId) {
  const cliente = await clienteComercialRepository.findById(clienteId);
  if (!cliente) throw new NotFoundError('El cliente comercial no existe.');
  return cliente;
}

async function resolverVehiculoReservable(vehiculoId) {
  const vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo) throw new NotFoundError('El vehículo no existe.');

  if (vehiculo.estado === ESTADO_VEHICULO_VENDIDO) {
    throw new ConflictError('El vehículo ya está vendido y no puede reservarse.');
  }
  if (vehiculo.estado !== ESTADO_VEHICULO_RESERVABLE) {
    throw new ConflictError(`El vehículo no está disponible para reservar (estado: ${vehiculo.estado}).`);
  }

  const activas = (await reservaRepository.findByVehiculo(vehiculoId)).filter(
    (reserva) => reserva.estado === 'activa' && !estaVencida(reserva)
  );
  if (activas.length > 0) {
    throw new ConflictError(`El vehículo ya tiene una reserva activa (${activas[0].numero}).`);
  }

  return vehiculo;
}

async function createReserva(datos, actor = {}) {
  const cliente = await resolverCliente(datos.clienteId);
  const vehiculo = await resolverVehiculoReservable(datos.vehiculoId);

  // Aparta la unidad de forma atómica: si alguien la reservó primero, falla.
  const reservado = await vehiculoRepository.cambiarEstadoCondicional(
    vehiculo.vehiculoId,
    ESTADO_VEHICULO_RESERVABLE,
    ESTADO_VEHICULO_RESERVADO,
    actor
  );
  if (!reservado) {
    throw new ConflictError('El vehículo acaba de dejar de estar disponible. Recarga la lista e inténtalo de nuevo.');
  }

  const creadaEn = new Date().toISOString();
  const anio = new Date(creadaEn).getFullYear();
  const secuencia = await reservaRepository.siguienteSecuencia(anio);
  const numero = `RES-${anio}-${String(secuencia).padStart(6, '0')}`;

  const vigenciaDias = datos.vigenciaDias ?? VIGENCIA_DIAS_DEFECTO;
  const fechaVencimiento = datos.fechaVencimiento ?? calcularFechaVencimiento(creadaEn, vigenciaDias);

  return reservaRepository.save({
    numero,
    clienteId: cliente.clienteId,
    cliente: resumenCliente(cliente),
    vehiculoId: vehiculo.vehiculoId,
    vehiculo: resumenVehiculo(vehiculo),
    condiciones: datos.condiciones,
    monto: datos.monto,
    estado: 'activa',
    vigenciaDias: datos.fechaVencimiento ? undefined : vigenciaDias,
    fechaVencimiento,
    historial: [{ estado: 'activa', fecha: creadaEn, usuario: autorNombre(actor) }],
    createdBy: actor?.sub ?? null,
    createdByName: autorNombre(actor),
    createdAt: creadaEn,
    updatedAt: creadaEn,
  });
}

async function cancelarReserva(reservaId, datos = {}, actor = {}) {
  const reserva = await getReserva(reservaId);
  if (reserva.estado !== 'activa') {
    throw new ConflictError('Solo se pueden cancelar reservas activas.');
  }

  const entrada = { estado: 'cancelada', fecha: new Date().toISOString(), usuario: autorNombre(actor) };
  if (datos.motivo) entrada.motivo = datos.motivo;

  const actualizada = await reservaRepository.update(reservaId, {
    estado: 'cancelada',
    historial: [...(reserva.historial ?? []), entrada],
  });

  await liberarVehiculo(reserva.vehiculoId);
  return actualizada;
}

async function convertirReserva(reservaId, datos = {}, actor = {}) {
  const reserva = await getReserva(reservaId);
  if (reserva.estado !== 'activa') {
    throw new ConflictError('Solo se pueden convertir en venta reservas activas.');
  }

  const vendido = await vehiculoRepository.cambiarEstadoCondicional(
    reserva.vehiculoId,
    ESTADO_VEHICULO_RESERVADO,
    ESTADO_VEHICULO_VENDIDO,
    actor
  );
  if (!vendido) {
    throw new ConflictError('El vehículo ya no está reservado; no se pudo registrar la venta.');
  }

  return reservaRepository.update(reservaId, {
    estado: 'convertida',
    observaciones: datos.observaciones,
    historial: [
      ...(reserva.historial ?? []),
      { estado: 'convertida', fecha: new Date().toISOString(), usuario: autorNombre(actor) },
    ],
  });
}

module.exports = {
  createReserva,
  listReservas,
  getReserva,
  cancelarReserva,
  convertirReserva,
  VIGENCIA_DIAS_DEFECTO,
};
