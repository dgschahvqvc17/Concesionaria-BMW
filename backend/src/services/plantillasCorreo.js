const REMITENTE = 'Concesionaria BMW';

function formatoFecha(iso) {
  return String(iso ?? '').replace('T', ' ').slice(0, 16);
}

function formatoMonto(valor) {
  return `${Number(valor ?? 0).toFixed(2)} Bs`;
}

function descripcionVehiculo(vehiculo) {
  return `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.version ?? ''} (${vehiculo.anio})`.replace(/\s+/g, ' ').trim();
}

function nombreCliente(cliente) {
  return `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim();
}

/**
 * Redacta el cuerpo del correo como texto plano (el transporte `mailto:`
 * no admite HTML). No incluye contraseñas ni datos internos: solo la
 * información comercial necesaria para el destinatario.
 */
function cuerpo(lineas) {
  return lineas.join('\r\n');
}

function asunto(titulo) {
  return `${titulo} - ${REMITENTE}`;
}

function reservaAlta(reserva) {
  return {
    asunto: asunto(`Reserva ${reserva.numero} confirmada`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(reserva.cliente)}:`,
      '',
      `Su reserva ${reserva.numero} fue registrada correctamente.`,
      '',
      `Vehículo: ${descripcionVehiculo(reserva.vehiculo)}`,
      `Monto de la reserva: ${reserva.monto != null ? formatoMonto(reserva.monto) : 'No especificado'}`,
      `Vigente hasta: ${formatoFecha(reserva.fechaVencimiento)}`,
      ...(reserva.condiciones ? ['', `Condiciones: ${reserva.condiciones}`] : []),
      '',
      'Si tiene alguna consulta responda a este correo o comuníquese con la concesionaria.',
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function reservaCancelada(reserva, motivo) {
  return {
    asunto: asunto(`Reserva ${reserva.numero} cancelada`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(reserva.cliente)}:`,
      '',
      `Su reserva ${reserva.numero} del vehículo ${descripcionVehiculo(reserva.vehiculo)} fue cancelada.`,
      ...(motivo ? ['', `Motivo: ${motivo}`] : []),
      '',
      'Si desea, con gusto la ayudamos a apartar otra unidad.',
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function reservaConvertida(reserva) {
  return {
    asunto: asunto(`Reserva ${reserva.numero} convertida en venta`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(reserva.cliente)}:`,
      '',
      `¡Gracias por su compra! Su reserva ${reserva.numero} fue convertida en venta del vehículo ${descripcionVehiculo(reserva.vehiculo)}.`,
      '',
      'Un asesor le contactará para coordinar la entrega.',
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function cotizacionEnvio(cotizacion) {
  return {
    asunto: asunto(`Cotización ${cotizacion.numero}`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(cotizacion.cliente)}:`,
      '',
      `Le enviamos la cotización ${cotizacion.numero} con los siguientes vehículos:`,
      '',
      ...cotizacion.items.map(
        (item) => `  • ${descripcionVehiculo(item)} - ${formatoMonto(item.precioUnitario)}`
      ),
      '',
      `Subtotal: ${formatoMonto(cotizacion.subtotal)}`,
      `Descuento (${cotizacion.descuentoPorcentaje}%): - ${formatoMonto(cotizacion.descuentoMonto)}`,
      `Total: ${formatoMonto(cotizacion.total)}`,
      `Vigencia: hasta el ${formatoFecha(cotizacion.fechaVencimiento)}`,
      ...(cotizacion.observaciones ? ['', `Observaciones: ${cotizacion.observaciones}`] : []),
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function cotizacionEstado(cotizacion, estado) {
  const titulos = { aceptada: 'aceptada', rechazada: 'rechazada', vencida: 'vencida' };
  const textos = {
    aceptada: 'Registramos su aceptación de la cotización. Un asesor le contactará para coordinar los siguientes pasos.',
    rechazada: 'Registramos que la cotización no fue de su agrado. Con gusto prepararemos una nueva propuesta.',
    vencida: 'La cotización llegó a su fecha de vencimiento. Solicite una nueva cotización con los precios vigentes.',
  };
  return {
    asunto: asunto(`Cotización ${cotizacion.numero} ${titulos[estado] ?? estado}`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(cotizacion.cliente)}:`,
      '',
      `La cotización ${cotizacion.numero} fue ${titulos[estado] ?? estado}.`,
      textos[estado] ?? '',
      '',
      `Total de la cotización: ${formatoMonto(cotizacion.total)}`,
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

const TITULOS_PRUEBA = {
  prueba_solicitada: 'Solicitud de prueba de manejo recibida',
  prueba_confirmada: 'Prueba de manejo confirmada',
  prueba_reprogramada: 'Prueba de manejo reprogramada',
  prueba_cancelada: 'Prueba de manejo cancelada',
  prueba_realizada: 'Prueba de manejo realizada',
};

const MENSAJES_PRUEBA = {
  prueba_solicitada: 'Recibimos su solicitud de prueba de manejo. El personal de la concesionaria la confirmará a la brevedad.',
  prueba_confirmada: 'Su prueba de manejo fue confirmada. Le esperamos en el horario indicado.',
  prueba_reprogramada: 'Su prueba de manejo fue reprogramada al nuevo horario indicado.',
  prueba_cancelada: 'Su prueba de manejo fue cancelada. Si desea agendar otra, contáctenos.',
  prueba_realizada: 'Gracias por participar en la prueba de manejo. Un asesor le contactará si tiene preguntas.',
};

function pruebaEvento(prueba, evento) {
  const titulo = TITULOS_PRUEBA[evento] ?? 'Actualización de prueba de manejo';
  const mensaje = MENSAJES_PRUEBA[evento] ?? 'Tiene una actualización sobre su prueba de manejo.';
  return {
    asunto: asunto(`${titulo} (${prueba.numero})`),
    cuerpo: cuerpo([
      `Estimado/a ${prueba.contacto.nombre}:`,
      '',
      mensaje,
      '',
      `Vehículo: ${descripcionVehiculo(prueba.vehiculo)}`,
      `Fecha y hora: ${formatoFecha(prueba.fechaHora)}`,
      `Duración: ${prueba.duracionMinutos} minutos`,
      `Número de solicitud: ${prueba.numero}`,
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function ventaConfirmada(venta) {
  return {
    asunto: asunto(`Compra confirmada ${venta.numero}`),
    cuerpo: cuerpo([
      `Estimado/a ${nombreCliente(venta.cliente)}:`,
      '',
      `Confirmamos la compra del vehículo ${descripcionVehiculo(venta.vehiculo)}.`,
      '',
      `Operación: ${venta.numero}`,
      `Precio final: ${formatoMonto(venta.precioFinal)}`,
      ...(venta.numeroReserva ? [`Generada desde la reserva ${venta.numeroReserva}`] : []),
      '',
      'Un asesor le contactará para coordinar la entrega. ¡Gracias por su compra!',
      '',
      'Saludos cordiales,',
      REMITENTE,
    ]),
  };
}

function ventaInterna(venta, actorNombre) {
  return {
    asunto: asunto(`Venta ${venta.numero} registrada`),
    cuerpo: cuerpo([
      `Hola ${actorNombre}:`,
      '',
      `Registraste la venta ${venta.numero} del vehículo ${descripcionVehiculo(venta.vehiculo)} al cliente ${nombreCliente(venta.cliente)}.`,
      '',
      `Precio final: ${formatoMonto(venta.precioFinal)}`,
      '',
      REMITENTE,
    ]),
  };
}

module.exports = {
  reservaAlta,
  reservaCancelada,
  reservaConvertida,
  cotizacionEnvio,
  cotizacionEstado,
  pruebaEvento,
  ventaConfirmada,
  ventaInterna,
};
