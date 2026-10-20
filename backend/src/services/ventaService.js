const { NotFoundError, ConflictError } = require('../errors/AppError');
const ventaRepository = require('../repositories/ventaRepository');
const reservaRepository = require('../repositories/reservaRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const { DESCUENTO_MAXIMO } = require('../validation/ventaSchemas');

const ESTADO_VEHICULO_DISPONIBLE = 'disponible';
const ESTADO_VEHICULO_RESERVADO = 'reservado';
const ESTADO_VEHICULO_VENDIDO = 'vendido';
const ESTADO_VEHICULO_NO_DISPONIBLE = 'no_disponible';

function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

/** Indica si una reserva activa ya expiró según su fecha de vencimiento. */
function estaExpirada(reserva) {
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

/** Snapshot del vehículo con su precio vigente al momento de vender. */
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

/** Marca como vencida (derivado) una reserva activa expirada y libera la unidad. */
async function cerrarReservaExpirada(reserva) {
  await reservaRepository.update(reserva.reservaId, {
    estado: 'vencida',
    historial: [
      ...(reserva.historial ?? []),
      { estado: 'vencida', fecha: new Date().toISOString(), motivo: 'Vencimiento automático' },
    ],
  });
  await vehiculoRepository.cambiarEstadoCondicional(
    reserva.vehiculoId,
    ESTADO_VEHICULO_RESERVADO,
    ESTADO_VEHICULO_DISPONIBLE
  );
}

/**
 * Valida que el vehículo pueda venderse (HU10): debe estar `disponible` o
 * `reservado` con una reserva vigente. Devuelve el vehículo y, si corresponde,
 * la reserva a la que se vinculará la venta.
 */
async function resolverVehiculoParaVenta(vehiculoId) {
  let vehiculo = await vehiculoRepository.findById(vehiculoId);
  if (!vehiculo) throw new NotFoundError('El vehículo no existe.');

  if (vehiculo.estado === ESTADO_VEHICULO_RESERVADO) {
    const reservas = await reservaRepository.findByVehiculo(vehiculoId);
    for (const reserva of reservas) {
      if (estaExpirada(reserva)) await cerrarReservaExpirada(reserva);
    }
    vehiculo = await vehiculoRepository.findById(vehiculoId);
  }

  if (vehiculo.estado === ESTADO_VEHICULO_VENDIDO) {
    throw new ConflictError('El vehículo ya está vendido.');
  }
  if (vehiculo.estado === ESTADO_VEHICULO_NO_DISPONIBLE) {
    throw new ConflictError('El vehículo no está disponible para la venta.');
  }

  // Un mismo vehículo no puede quedar en dos operaciones activas.
  const previas = await ventaRepository.findByVehiculo(vehiculoId);
  if (previas.length > 0) {
    throw new ConflictError(`El vehículo ya fue vendido en la operación ${previas[0].numero}.`);
  }

  let reserva = null;
  if (vehiculo.estado === ESTADO_VEHICULO_RESERVADO) {
    const vigentes = (await reservaRepository.findByVehiculo(vehiculoId)).filter(
      (r) => r.estado === 'activa' && !estaExpirada(r)
    );
    if (vigentes.length === 0) {
      throw new ConflictError('El vehículo está reservado sin una reserva vigente. Libera la unidad antes de venderla.');
    }
    reserva = vigentes[0];
  }

  return { vehiculo, reserva };
}

async function createVenta(datos, actor = {}) {
  const cliente = await clienteComercialRepository.findById(datos.clienteId);
  if (!cliente) throw new NotFoundError('El cliente comercial no existe.');

  const { vehiculo, reserva } = await resolverVehiculoParaVenta(datos.vehiculoId);

  if (datos.reservaId && (!reserva || reserva.reservaId !== datos.reservaId)) {
    throw new ConflictError('La reserva indicada no corresponde a una reserva vigente del vehículo.');
  }

  // Aparta la unidad de forma atómica: si otro proceso la vendió primero, falla.
  const vendido = await vehiculoRepository.cambiarEstadoCondicional(
    vehiculo.vehiculoId,
    vehiculo.estado,
    ESTADO_VEHICULO_VENDIDO,
    actor
  );
  if (!vendido) {
    throw new ConflictError('El vehículo acaba de cambiar de estado. Recarga la lista e inténtalo de nuevo.');
  }

  const ahora = new Date().toISOString();
  const anio = new Date(ahora).getFullYear();
  const secuencia = await ventaRepository.siguienteSecuencia(anio);
  const numero = `VTA-${anio}-${String(secuencia).padStart(6, '0')}`;

  const descuentoPorcentaje = datos.descuentoPorcentaje ?? 0;
  const precioLista = vehiculo.precio;
  const descuentoMonto = redondear((precioLista * descuentoPorcentaje) / 100);
  const precioFinal = redondear(precioLista - descuentoMonto);

  const venta = await ventaRepository.save({
    numero,
    clienteId: cliente.clienteId,
    cliente: resumenCliente(cliente),
    vehiculoId: vehiculo.vehiculoId,
    vehiculo: resumenVehiculo(vehiculo),
    reservaId: reserva?.reservaId ?? null,
    numeroReserva: reserva?.numero ?? null,
    precioLista,
    descuentoPorcentaje,
    descuentoMonto,
    precioFinal,
    observaciones: datos.observaciones,
    fechaVenta: datos.fechaVenta ?? ahora,
    createdBy: actor?.sub ?? null,
    createdByName: autorNombre(actor),
    createdAt: ahora,
    updatedAt: ahora,
  });

  if (reserva) {
    await reservaRepository.update(reserva.reservaId, {
      estado: 'convertida',
      ventaId: venta.ventaId,
      ventaNumero: numero,
      historial: [
        ...(reserva.historial ?? []),
        { estado: 'convertida', fecha: ahora, usuario: autorNombre(actor), motivo: `Venta ${numero}` },
      ],
    });
  }

  return venta;
}

async function listVentas({ clienteId, vehiculoId } = {}) {
  let ventas;
  if (clienteId) ventas = await ventaRepository.findByCliente(clienteId);
  else if (vehiculoId) ventas = await ventaRepository.findByVehiculo(vehiculoId);
  else ventas = await ventaRepository.listAll();

  return ventas.sort((a, b) =>
    String(b.fechaVenta ?? b.createdAt ?? '').localeCompare(String(a.fechaVenta ?? a.createdAt ?? ''))
  );
}

async function getVenta(ventaId) {
  const venta = await ventaRepository.findById(ventaId);
  if (!venta) throw new NotFoundError('Venta no encontrada.');
  return venta;
}

module.exports = { createVenta, listVentas, getVenta, DESCUENTO_MAXIMO };
