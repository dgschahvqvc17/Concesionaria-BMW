const { NotFoundError, ConflictError } = require('../errors/AppError');
const cotizacionRepository = require('../repositories/cotizacionRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const notificacionService = require('./notificacionService');
const { registrarSinFallo } = notificacionService;
const { DESCUENTO_MAXIMO } = require('../validation/cotizacionSchemas');

/** Días de vigencia por defecto de una cotización (HU08). */
const VIGENCIA_DIAS_DEFECTO = 15;

/** Solo los vehículos disponibles o reservados pueden cotizarse (regla comercial). */
const ESTADOS_VEHICULO_COTIZABLES = ['disponible', 'reservado'];

/** Redondea a 2 decimales para evitar errores de coma flotante en los importes. */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

function calcularImportes(subtotal, descuentoPorcentaje) {
  const descuentoMonto = redondear((subtotal * descuentoPorcentaje) / 100);
  return { descuentoMonto, total: redondear(subtotal - descuentoMonto) };
}

function calcularFechaVencimiento(desde, dias) {
  const fecha = new Date(desde);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString();
}

/** Marca como vencida (derivado) una cotización pendiente cuya vigencia expiró. */
function normalizarEstado(cotizacion) {
  const expirada =
    cotizacion.estado === 'pendiente' &&
    cotizacion.fechaVencimiento &&
    new Date(cotizacion.fechaVencimiento) < new Date();

  return expirada ? { ...cotizacion, estado: 'vencida', vencida: true } : cotizacion;
}

async function listCotizaciones({ clienteId, estado } = {}) {
  const cotizaciones = clienteId
    ? await cotizacionRepository.findByCliente(clienteId)
    : await cotizacionRepository.listAll();

  const normalizadas = cotizaciones.map(normalizarEstado);
  const filtradas = estado ? normalizadas.filter((c) => c.estado === estado) : normalizadas;

  return filtradas.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}

async function getCotizacion(cotizacionId) {
  const cotizacion = await cotizacionRepository.findById(cotizacionId);
  if (!cotizacion) throw new NotFoundError('Cotización no encontrada.');
  return normalizarEstado(cotizacion);
}

async function resolverCliente(clienteId) {
  const cliente = await clienteComercialRepository.findById(clienteId);
  if (!cliente) throw new NotFoundError('El cliente comercial no existe.');
  return cliente;
}

async function resolverVehiculos(vehiculoIds) {
  const idsUnicos = [...new Set(vehiculoIds)];
  const vehiculos = [];

  for (const vehiculoId of idsUnicos) {
    const vehiculo = await vehiculoRepository.findById(vehiculoId);
    if (!vehiculo) throw new NotFoundError('Uno de los vehículos seleccionados no existe.');
    if (!ESTADOS_VEHICULO_COTIZABLES.includes(vehiculo.estado)) {
      throw new ConflictError(
        `El vehículo ${vehiculo.marca} ${vehiculo.modelo} no está disponible para cotizar (estado: ${vehiculo.estado}).`
      );
    }
    vehiculos.push(vehiculo);
  }

  return vehiculos;
}

/** Guarda una copia (snapshot) del vehículo con su precio vigente. */
function mapearItem(vehiculo) {
  return {
    vehiculoId: vehiculo.vehiculoId,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    version: vehiculo.version,
    anio: vehiculo.anio,
    vin: vehiculo.vin,
    precioUnitario: vehiculo.precio,
    subtotal: redondear(vehiculo.precio),
  };
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

async function createCotizacion(datos, actor = {}) {
  const cliente = await resolverCliente(datos.clienteId);
  const vehiculos = await resolverVehiculos(datos.vehiculoIds);

  const items = vehiculos.map(mapearItem);
  const subtotal = redondear(items.reduce((acc, item) => acc + item.precioUnitario, 0));
  const descuentoPorcentaje = datos.descuentoPorcentaje ?? 0;
  const { descuentoMonto, total } = calcularImportes(subtotal, descuentoPorcentaje);

  const creadaEn = new Date().toISOString();
  const anio = new Date(creadaEn).getFullYear();
  const secuencia = await cotizacionRepository.siguienteSecuencia(anio);
  const numero = `COT-${anio}-${String(secuencia).padStart(6, '0')}`;
  const vigenciaDias = datos.vigenciaDias ?? VIGENCIA_DIAS_DEFECTO;

  return cotizacionRepository.save({
    numero,
    clienteId: cliente.clienteId,
    cliente: resumenCliente(cliente),
    items,
    subtotal,
    descuentoPorcentaje,
    descuentoMonto,
    total,
    observaciones: datos.observaciones,
    estado: 'pendiente',
    vigenciaDias,
    fechaVencimiento: calcularFechaVencimiento(creadaEn, vigenciaDias),
    createdBy: actor?.sub ?? null,
    createdByName: actor?.name || actor?.email || null,
    createdAt: creadaEn,
    updatedAt: creadaEn,
  });
}

async function updateCotizacion(cotizacionId, datos) {
  const cotizacion = await getCotizacion(cotizacionId);

  if (cotizacion.estado !== 'pendiente') {
    throw new ConflictError('Solo se pueden modificar cotizaciones en estado pendiente.');
  }

  const updates = {};
  if (datos.observaciones !== undefined) updates.observaciones = datos.observaciones;
  if (datos.estado !== undefined) updates.estado = datos.estado;
  if (datos.descuentoPorcentaje !== undefined) {
    const { descuentoMonto, total } = calcularImportes(cotizacion.subtotal, datos.descuentoPorcentaje);
    updates.descuentoPorcentaje = datos.descuentoPorcentaje;
    updates.descuentoMonto = descuentoMonto;
    updates.total = total;
  }

  const actualizada = await cotizacionRepository.update(cotizacionId, updates);

  if (updates.estado === 'aceptada' || updates.estado === 'rechazada') {
    await registrarSinFallo(() => notificacionService.notificarCotizacion(actualizada, `cotizacion_${updates.estado}`));
  }

  return actualizada;
}

/**
 * Envío de la cotización solicitado por el vendedor (HU12): asegura el
 * registro de la notificación (dedup por evento) e intenta el envío.
 */
async function enviarCorreo(cotizacionId, actor = {}) {
  const cotizacion = await getCotizacion(cotizacionId);
  const { notificacion } = await notificacionService.notificarCotizacion(cotizacion, 'cotizacion_envio');
  const resultado = await notificacionService.enviar(notificacion.eventoId, actor);
  return resultado;
}

module.exports = {
  createCotizacion,
  listCotizaciones,
  getCotizacion,
  updateCotizacion,
  enviarCorreo,
  DESCUENTO_MAXIMO,
  VIGENCIA_DIAS_DEFECTO,
};
