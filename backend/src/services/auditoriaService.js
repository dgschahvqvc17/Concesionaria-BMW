const auditoriaRepository = require('../repositories/auditoriaRepository');

const TIPOS_OPERACION = [
  'auth',
  'usuario',
  'vehiculo',
  'repuesto',
  'movimiento',
  'cliente_comercial',
  'cotizacion',
  'reserva',
  'venta',
  'prueba_manejo',
  'notificacion',
  'cita_taller',
  'reporte',
  'sistema',
];

function fechaYHora() {
  const ahora = new Date();
  return {
    fecha: ahora.toISOString().slice(0, 10),
    fechaHora: ahora.toISOString(),
    createdAt: ahora.toISOString(),
  };
}

function extraerActor(req) {
  const auth = req.auth || {};
  const roles = req.authRoles || [];
  return {
    usuarioId: auth.sub || req.user?.sub || null,
    usuarioNombre: auth.name || auth['cognito:username'] || req.user?.name || 'Anónimo',
    usuarioEmail: auth.email || req.user?.email || null,
    roles,
  };
}

function extraerContexto(req) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
  return {
    ip,
    userAgent: req.headers['user-agent'] || null,
  };
}

/**
 * Registra una operación importante en el registro de auditoría (HU18).
 * Nunca lanza errores para no interrumpir la operación principal.
 */
async function registrarOperacion(req, datos = {}) {
  try {
    const actor = extraerActor(req);
    const ctx = extraerContexto(req);
    const { fecha, fechaHora, createdAt } = fechaYHora();

    await auditoriaRepository.crear({
      fecha,
      fechaHora,
      createdAt,
      ...actor,
      accion: datos.accion,
      tipo: datos.tipo || 'sistema',
      recursoTipo: datos.recursoTipo || null,
      recursoId: datos.recursoId || null,
      descripcion: datos.descripcion || '',
      metadata: datos.metadata || {},
      ...ctx,
    });
  } catch {
    // Registro de auditoría no debe romper la operación principal.
  }
}

async function listar(filtros = {}) {
  const { usuarioId, tipo, recursoTipo, recursoId, fechaDesde, fechaHasta } = filtros;
  let eventos = await auditoriaRepository.listAll();

  if (usuarioId) {
    eventos = eventos.filter((e) => e.usuarioId === usuarioId);
  }
  if (tipo) {
    eventos = eventos.filter((e) => e.tipo === tipo);
  }
  if (recursoTipo && recursoId) {
    eventos = eventos.filter((e) => e.recursoTipo === recursoTipo && e.recursoId === recursoId);
  } else if (recursoId) {
    eventos = eventos.filter((e) => e.recursoId === recursoId);
  } else if (recursoTipo) {
    eventos = eventos.filter((e) => e.recursoTipo === recursoTipo);
  }

  if (fechaDesde) {
    eventos = eventos.filter((e) => (e.fechaHora || e.createdAt) >= fechaDesde);
  }
  if (fechaHasta) {
    eventos = eventos.filter((e) => (e.fechaHora || e.createdAt) <= fechaHasta);
  }

  eventos.sort((a, b) => (b.fechaHora || b.createdAt || '').localeCompare(a.fechaHora || a.createdAt || ''));
  return eventos;
}

module.exports = { TIPOS_OPERACION, registrarOperacion, listar };
