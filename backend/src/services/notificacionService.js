const { NotFoundError, ValidationError, ConflictError } = require('../errors/AppError');
const notificacionRepository = require('../repositories/notificacionRepository');
const plantillasCorreo = require('./plantillasCorreo');
const { MAX_INTENTOS } = require('../validation/notificacionSchemas');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function nombreCompleto(persona) {
  return `${persona?.nombres ?? ''} ${persona?.apellidos ?? ''}`.trim() || null;
}

/**
 * Clave única por evento + destinatario: el Put condicional sobre `eventoId`
 * garantiza un solo registro (y por tanto un solo envío base) por evento.
 */
function claveEvento({ tipo, recursoId, evento, destinatario }) {
  return `${tipo}:${recursoId}:${evento}:${(destinatario || 'sin-correo').toLowerCase()}`;
}

function entradasHistorial(notificacion, resultado, detalle) {
  return [...(notificacion.historial ?? []), { fecha: new Date().toISOString(), resultado, ...(detalle ? { detalle } : {}) }];
}

/**
 * Registra la notificación de un evento de negocio. Si el evento ya fue
 * registrado para ese destinatario devuelve el registro existente (dedup).
 */
async function registrarEvento({ tipo, recursoId, evento, numero, destinatario, destinatarioNombre, plantilla }) {
  const destino = typeof destinatario === 'string' && destinatario.trim() ? destinatario.trim() : null;
  const ahora = new Date().toISOString();

  const notificacion = {
    eventoId: claveEvento({ tipo, recursoId, evento, destinatario: destino }),
    tipo,
    evento,
    recursoId,
    numero: numero ?? null,
    destinatario: destino,
    destinatarioNombre: destinatarioNombre ?? null,
    asunto: plantilla.asunto,
    cuerpo: plantilla.cuerpo,
    estado: destino ? 'pendiente' : 'omitido',
    intentos: 0,
    maxIntentos: MAX_INTENTOS,
    historial: destino
      ? [{ fecha: ahora, resultado: 'Notificación registrada' }]
      : [{ fecha: ahora, resultado: 'Sin correo de contacto', detalle: 'La operación no tiene un correo de contacto válido.' }],
    createdAt: ahora,
    updatedAt: ahora,
  };

  const guardada = await notificacionRepository.save(notificacion);
  return { notificacion: guardada ?? (await notificacionRepository.findById(notificacion.eventoId)), creada: Boolean(guardada) };
}

/** Ejecuta un registro de notificación sin interrumpir la operación de negocio. */
async function registrarSinFallo(fn) {
  try {
    return await fn();
  } catch (error) {
    console.error('[notificaciones] No se pudo registrar la notificación:', error?.message ?? error);
    return null;
  }
}

/** Construye el enlace `mailto:` con destinatario, asunto y cuerpo redactados. */
function construirMailto(notificacion) {
  const subject = encodeURIComponent(notificacion.asunto);
  const body = encodeURIComponent(notificacion.cuerpo);
  return `mailto:${encodeURIComponent(notificacion.destinatario)}?subject=${subject}&body=${body}`;
}

async function intentarEnvio(notificacion, resultado, estado, detalle) {
  return notificacionRepository.update(notificacion.eventoId, {
    intentos: notificacion.intentos + 1,
    estado,
    ultimoResultado: resultado,
    ultimoIntentoAt: new Date().toISOString(),
    historial: entradasHistorial(notificacion, resultado, detalle),
  });
}

/**
 * Registra un intento de envío y devuelve el enlace `mailto:` listo para abrir.
 * El transporte es el cliente de correo del usuario (decisión de diseño HU12:
 * sin SES para no salir de la capa gratuita de AWS); por eso la entrega no
 * puede confirmarse y el resultado del intento queda registrado como generado.
 */
async function enviar(notificacionId, actor = {}) {
  const notificacion = await notificacionRepository.findById(notificacionId);
  if (!notificacion) throw new NotFoundError('La notificación no existe.');

  if (notificacion.estado === 'omitido') {
    throw new ValidationError('Esta operación no tiene un correo de contacto válido para enviar la notificación.');
  }

  if (notificacion.intentos >= (notificacion.maxIntentos ?? MAX_INTENTOS)) {
    throw new ConflictError(
      `Se alcanzó el máximo de intentos (${notificacion.maxIntentos ?? MAX_INTENTOS}) para esta notificación.`
    );
  }

  if (!emailValido(notificacion.destinatario)) {
    await intentarEnvio(notificacion, 'Correo inválido', 'fallido', `Destinatario inválido: ${notificacion.destinatario}`);
    throw new ValidationError('La dirección de correo del destinatario no es válida.');
  }

  const actualizada = await intentarEnvio(notificacion, 'Enlace de correo generado', 'intentado');
  return {
    notificacion: actualizada,
    mailto: construirMailto(actualizada),
    enviadoPor: actor?.name || actor?.email || null,
  };
}

async function list({ tipo, estado, recursoId } = {}) {
  const notificaciones = recursoId
    ? await notificacionRepository.findByRecurso(recursoId)
    : await notificacionRepository.listAll();

  const filtradas = notificaciones.filter(
    (n) => (!tipo || n.tipo === tipo) && (!estado || n.estado === estado)
  );
  return filtradas.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
}

async function get(eventoId) {
  const notificacion = await notificacionRepository.findById(eventoId);
  if (!notificacion) throw new NotFoundError('La notificación no existe.');
  return notificacion;
}

function notificarReserva(reserva, evento, extras = {}) {
  return registrarEvento({
    tipo: 'reserva',
    recursoId: reserva.reservaId,
    evento,
    numero: reserva.numero,
    destinatario: reserva.cliente?.email,
    destinatarioNombre: nombreCompleto(reserva.cliente),
    plantilla:
      evento === 'reserva_cancelada'
        ? plantillasCorreo.reservaCancelada(reserva, extras.motivo)
        : evento === 'reserva_convertida'
          ? plantillasCorreo.reservaConvertida(reserva)
          : plantillasCorreo.reservaAlta(reserva),
  });
}

function notificarCotizacion(cotizacion, evento) {
  return registrarEvento({
    tipo: 'cotizacion',
    recursoId: cotizacion.cotizacionId,
    evento,
    numero: cotizacion.numero,
    destinatario: cotizacion.cliente?.email,
    destinatarioNombre: nombreCompleto(cotizacion.cliente),
    plantilla:
      evento === 'cotizacion_envio'
        ? plantillasCorreo.cotizacionEnvio(cotizacion)
        : plantillasCorreo.cotizacionEstado(cotizacion, evento.replace('cotizacion_', '')),
  });
}

function notificarPrueba(prueba, evento) {
  return registrarEvento({
    tipo: 'prueba_manejo',
    recursoId: prueba.pruebaId,
    evento,
    numero: prueba.numero,
    destinatario: prueba.contacto?.email,
    destinatarioNombre: prueba.contacto?.nombre ?? null,
    plantilla: plantillasCorreo.pruebaEvento(prueba, evento),
  });
}

function notificarCita(cita, evento) {
  return registrarEvento({
    tipo: 'cita_taller',
    recursoId: cita.citaId,
    evento,
    numero: cita.numero,
    destinatario: cita.cliente?.email,
    destinatarioNombre: nombreCompleto(cita.cliente),
    plantilla: plantillasCorreo.citaEvento(cita, evento),
  });
}

function notificarVenta(venta, evento, extras = {}) {
  if (evento === 'venta_confirmada_vendedor') {
    return registrarEvento({
      tipo: 'venta',
      recursoId: venta.ventaId,
      evento,
      numero: venta.numero,
      destinatario: extras.email,
      destinatarioNombre: extras.nombre ?? null,
      plantilla: plantillasCorreo.ventaInterna(venta, extras.nombre ?? 'vendedor'),
    });
  }
  return registrarEvento({
    tipo: 'venta',
    recursoId: venta.ventaId,
    evento,
    numero: venta.numero,
    destinatario: venta.cliente?.email,
    destinatarioNombre: nombreCompleto(venta.cliente),
    plantilla: plantillasCorreo.ventaConfirmada(venta),
  });
}

module.exports = {
  MAX_INTENTOS,
  emailValido,
  registrarEvento,
  registrarSinFallo,
  enviar,
  list,
  get,
  notificarReserva,
  notificarCotizacion,
  notificarPrueba,
  notificarCita,
  notificarVenta,
};
