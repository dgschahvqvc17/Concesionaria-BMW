const vehiculoRepository = require('../repositories/vehiculoRepository');
const ventaRepository = require('../repositories/ventaRepository');
const cotizacionRepository = require('../repositories/cotizacionRepository');
const citaTallerRepository = require('../repositories/citaTallerRepository');
const repuestoRepository = require('../repositories/repuestoRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');

/** Estados del vehículo considerados en el inventario (HU17). */
const ESTADOS_VEHICULO = ['disponible', 'reservado', 'vendido', 'no_disponible'];

/** Estados derivados de las cotizaciones (HU17). */
const ESTADOS_COTIZACION = ['pendiente', 'aceptada', 'rechazada', 'vencida'];

/** Estados de las citas del taller (HU17). */
const ESTADOS_CITA = ['solicitada', 'confirmada', 'en_atencion', 'finalizada', 'cancelada'];

function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

/** Convierte una fecha ISO a clave `AAAA-MM` (para agrupar por mes). */
function claveMes(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

/** Indica si una fecha ISO cae dentro del rango (inclusive) solicitado. */
function dentroDelRango(iso, desde, hasta) {
  if (!iso) return false;
  const fecha = new Date(iso).getTime();
  if (Number.isNaN(fecha)) return false;
  if (desde) {
    const d = new Date(desde).getTime();
    if (fecha < d) return false;
  }
  if (hasta) {
    const h = new Date(hasta).getTime();
    if (fecha > h) return false;
  }
  return true;
}

/** Cuenta elementos por una clave, devolviendo un objeto de totales. */
function agrupar(items, obtenerClave) {
  const conteo = {};
  for (const item of items) {
    const clave = obtenerClave(item);
    if (clave === null || clave === undefined) continue;
    conteo[clave] = (conteo[clave] ?? 0) + 1;
  }
  return conteo;
}

/** Normaliza el estado derivado de una cotización (vencida por vigencia). */
function estadoCotizacion(cotizacion) {
  const vencida =
    cotizacion.estado === 'pendiente' &&
    cotizacion.fechaVencimiento &&
    new Date(cotizacion.fechaVencimiento) < new Date();
  return vencida ? 'vencida' : cotizacion.estado;
}

/** Reporte de inventario: cantidad de vehículos por estado y valor del stock. */
async function reporteInventario() {
  const vehiculos = await vehiculoRepository.listAll();
  const porEstado = {};
  for (const estado of ESTADOS_VEHICULO) porEstado[estado] = 0;
  let valorInventario = 0;

  for (const vehiculo of vehiculos) {
    const estado = ESTADOS_VEHICULO.includes(vehiculo.estado) ? vehiculo.estado : 'no_disponible';
    porEstado[estado] += 1;
    if (estado === 'disponible' || estado === 'reservado') {
      valorInventario += Number(vehiculo.precio ?? 0);
    }
  }

  return {
    tipo: 'inventario',
    total: vehiculos.length,
    porEstado,
    valorInventario: redondear(valorInventario),
  };
}

/** Reporte de ventas: registros del período, importes y agrupación mensual. */
async function reporteVentas({ fechaDesde, fechaHasta } = {}) {
  const ventas = (await ventaRepository.listAll()).filter((venta) =>
    dentroDelRango(venta.fechaVenta ?? venta.createdAt, fechaDesde, fechaHasta)
  );

  let totalLista = 0;
  let totalDescuento = 0;
  let totalFinal = 0;
  const porMes = {};

  for (const venta of ventas) {
    totalLista += Number(venta.precioLista ?? 0);
    totalDescuento += Number(venta.descuentoMonto ?? 0);
    totalFinal += Number(venta.precioFinal ?? 0);

    const mes = claveMes(venta.fechaVenta ?? venta.createdAt);
    if (mes) {
      if (!porMes[mes]) porMes[mes] = { cantidad: 0, importe: 0 };
      porMes[mes].cantidad += 1;
      porMes[mes].importe = redondear(porMes[mes].importe + Number(venta.precioFinal ?? 0));
    }
  }

  const serieMensual = Object.keys(porMes)
    .sort()
    .map((mes) => ({ mes, cantidad: porMes[mes].cantidad, importe: porMes[mes].importe }));

  return {
    tipo: 'ventas',
    total: ventas.length,
    totalLista: redondear(totalLista),
    totalDescuento: redondear(totalDescuento),
    totalFinal: redondear(totalFinal),
    ticketPromedio: ventas.length > 0 ? redondear(totalFinal / ventas.length) : 0,
    porMes: serieMensual,
  };
}

/** Reporte de cotizaciones por estado y su importe total. */
async function reporteCotizaciones({ fechaDesde, fechaHasta } = {}) {
  const cotizaciones = (await cotizacionRepository.listAll()).filter((cotizacion) =>
    dentroDelRango(cotizacion.createdAt, fechaDesde, fechaHasta)
  );

  const porEstado = {};
  for (const estado of ESTADOS_COTIZACION) porEstado[estado] = 0;
  let importeTotal = 0;

  for (const cotizacion of cotizaciones) {
    const estado = estadoCotizacion(cotizacion);
    porEstado[estado] = (porEstado[estado] ?? 0) + 1;
    if (estado === 'pendiente' || estado === 'aceptada') importeTotal += Number(cotizacion.total ?? 0);
  }

  return {
    tipo: 'cotizaciones',
    total: cotizaciones.length,
    porEstado,
    importeTotal: redondear(importeTotal),
  };
}

/** Reporte del taller: citas por estado y órdenes de trabajo finalizadas. */
async function reporteTaller({ fechaDesde, fechaHasta } = {}) {
  const citas = (await citaTallerRepository.listAll()).filter((cita) =>
    dentroDelRango(cita.fechaHora ?? cita.createdAt, fechaDesde, fechaHasta)
  );

  const porEstado = {};
  for (const estado of ESTADOS_CITA) porEstado[estado] = 0;
  const porTipo = {};
  let repuestosConsumidos = 0;

  for (const cita of citas) {
    const estado = ESTADOS_CITA.includes(cita.estado) ? cita.estado : 'cancelada';
    porEstado[estado] += 1;
    porTipo[cita.tipoServicio] = (porTipo[cita.tipoServicio] ?? 0) + 1;
    repuestosConsumidos += (cita.repuestosUtilizados ?? []).length;
  }

  return {
    tipo: 'taller',
    total: citas.length,
    porEstado,
    porTipo,
    ordenesFinalizadas: porEstado.finalizada,
    repuestosConsumidos,
  };
}

/** Reporte de repuestos: existencias bajas y valor del inventario de repuestos. */
async function reporteRepuestos() {
  const repuestos = await repuestoRepository.listAll();

  let valorInventario = 0;
  const bajos = [];

  for (const repuesto of repuestos) {
    const cantidad = Number(repuesto.cantidad ?? 0);
    const precio = Number(repuesto.precio ?? 0);
    valorInventario += cantidad * precio;

    const minima = Number(repuesto.cantidadMinima ?? 0);
    if (cantidad <= minima) {
      bajos.push({
        repuestoId: repuesto.repuestoId,
        codigo: repuesto.codigo,
        nombre: repuesto.nombre,
        cantidad,
        cantidadMinima: minima,
      });
    }
  }

  bajos.sort((a, b) => a.cantidad - b.cantidad);

  return {
    tipo: 'repuestos',
    total: repuestos.length,
    valorInventario: redondear(valorInventario),
    bajos,
  };
}

/** Reporte de clientes comerciales por estado de seguimiento. */
async function reporteClientes() {
  const clientes = await clienteComercialRepository.listAll();
  const porEstado = agrupar(clientes, (cliente) => cliente.estadoSeguimiento ?? 'nuevo');

  return {
    tipo: 'clientes',
    total: clientes.length,
    porEstado,
  };
}

/** Arma el resumen consolidado del módulo de reportes (HU17). */
async function resumen({ fechaDesde, fechaHasta } = {}) {
  const [inventario, ventas, cotizaciones, taller, repuestos, clientes] = await Promise.all([
    reporteInventario(),
    reporteVentas({ fechaDesde, fechaHasta }),
    reporteCotizaciones({ fechaDesde, fechaHasta }),
    reporteTaller({ fechaDesde, fechaHasta }),
    reporteRepuestos(),
    reporteClientes(),
  ]);

  return {
    generadoEn: new Date().toISOString(),
    periodo: { fechaDesde: fechaDesde ?? null, fechaHasta: fechaHasta ?? null },
    inventario,
    ventas,
    cotizaciones,
    taller,
    repuestos,
    clientes,
  };
}

/** Devuelve el reporte del tipo solicitado (HU17). */
async function porTipo(tipo, filtros = {}) {
  switch (tipo) {
    case 'inventario':
      return reporteInventario();
    case 'ventas':
      return reporteVentas(filtros);
    case 'clientes':
      return reporteClientes();
    case 'taller':
      return reporteTaller(filtros);
    case 'repuestos':
      return reporteRepuestos();
    default:
      return null;
  }
}

module.exports = { resumen, porTipo };
