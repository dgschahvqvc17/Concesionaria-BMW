const auditoriaService = require('../services/auditoriaService');

/** Tipos de recurso derivados de la ruta de la API (HU18). */
const RECURSOS_POR_RUTA = {
  '/api/auth': 'auth',
  '/api/usuarios': 'usuario',
  '/api/clientes': 'cliente',
  '/api/clientes-comerciales': 'cliente_comercial',
  '/api/vehiculos': 'vehiculo',
  '/api/repuestos': 'repuesto',
  '/api/movimientos': 'movimiento',
  '/api/cotizaciones': 'cotizacion',
  '/api/reservas': 'reserva',
  '/api/ventas': 'venta',
  '/api/pruebas-man': 'prueba_manejo',
  '/api/notificaciones': 'notificacion',
  '/api/citas-taller': 'cita_taller',
};

/** Sufijos de ruta que describen una acción concreta. */
const ACCIONES_POR_SUFIJO = {
  confirmar: 'confirmar',
  cancelar: 'cancelar',
  reprogramar: 'reprogramar',
  realizar: 'realizar',
  convertir: 'convertir',
  asignar: 'asignar',
  avances: 'registrar_avance',
  iniciar: 'iniciar',
  finalizar: 'finalizar',
  presign: 'firmar_subida',
  'enviar-correo': 'enviar_correo',
  enviar: 'enviar',
  consultas: 'registrar_consulta',
  estado: 'cambiar_estado',
};

/** Acciones que producen un recurso de otro tipo que el de la ruta (HU18). */
const TIPO_RESULTANTE = {
  'reserva:convertir': 'venta',
};

/** Rutas que no se auditan (sin escritura de negocio). */
const RUTAS_EXCLUIDAS = ['/api/auditoria'];

function esMetodoAuditable(method) {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);
}

/** Devuelve el tipo de recurso y la subruta de una ruta de la API. */
function analizarRuta(ruta) {
  const limpia = ruta.split('?')[0].replace(/\/$/, '');
  for (const [prefijo, tipo] of Object.entries(RECURSOS_POR_RUTA)) {
    if (limpia === prefijo || limpia.startsWith(`${prefijo}/`)) {
      const resto = limpia.slice(prefijo.length).split('/').filter(Boolean);
      const sufijo = resto.length > 1 ? resto[resto.length - 1] : null;
      return { tipo, sufijo, ruta: limpia };
    }
  }
  return { tipo: 'sistema', sufijo: null, ruta: limpia };
}

/** Traduce método y subruta a una acción legible. */
function resolverAccion(method, sufijo) {
  if (sufijo && ACCIONES_POR_SUFIJO[sufijo]) return ACCIONES_POR_SUFIJO[sufijo];
  if (method === 'POST') return 'crear';
  if (method === 'PATCH' || method === 'PUT') return 'actualizar';
  if (method === 'DELETE') return 'eliminar';
  return method.toLowerCase();
}

/** Busca el identificador del recurso afectado en los parámetros de ruta. */
function resolverRecursoId(req) {
  for (const [clave, valor] of Object.entries(req.params || {})) {
    if (clave.toLowerCase().endsWith('id') && typeof valor === 'string') return valor;
  }
  return null;
}

/** Extrae el identificador (y número) del recurso creado en la respuesta. */
function extraerRecursoCreado(payload) {
  if (!payload || typeof payload !== 'object') return { id: null, numero: null };

  const buscar = (objeto, nivel) => {
    if (!objeto || typeof objeto !== 'object' || nivel > 2) return null;
    for (const [clave, valor] of Object.entries(objeto)) {
      if (typeof valor !== 'string') continue;
      if (clave.toLowerCase().endsWith('numero')) return valor;
      if (clave.toLowerCase().endsWith('id') && !clave.toLowerCase().endsWith('eventoid')) return valor;
    }
    for (const valor of Object.values(objeto)) {
      if (valor && typeof valor === 'object') {
        const encontrado = buscar(valor, nivel + 1);
        if (encontrado) return encontrado;
      }
    }
    return null;
  };

  return { id: buscar(payload, 0), numero: null };
}

/**
 * Middleware que registra en auditoría las operaciones de escritura (HU18).
 * El registro ocurre al finalizar la respuesta y nunca altera el resultado.
 */
function auditoriaMiddleware(req, res, next) {
  if (!esMetodoAuditable(req.method)) return next();

  const { tipo, sufijo, ruta } = analizarRuta(req.originalUrl || req.url);
  if (RUTAS_EXCLUIDAS.includes(ruta)) return next();

  const accion = resolverAccion(req.method, sufijo);
  const tipoFinal = TIPO_RESULTANTE[`${tipo}:${accion}`] ?? tipo;
  let cuerpoRespuesta = null;

  const jsonOriginal = res.json.bind(res);
  res.json = (cuerpo) => {
    cuerpoRespuesta = cuerpo;
    return jsonOriginal(cuerpo);
  };

  res.on('finish', () => {
    const recursoId = resolverRecursoId(req);
    const creado = extraerRecursoCreado(cuerpoRespuesta);
    const recursoFinal = recursoId || creado.id || null;
    const numero = creado.numero || null;

    const descripcion = [
      `${req.method} ${ruta}`,
      res.statusCode < 400 ? 'completada' : `respondió ${res.statusCode}`,
    ].join(' — ');

    void auditoriaService.registrarOperacion(req, {
      accion,
      tipo: tipoFinal,
      recursoTipo: tipoFinal === 'auth' ? null : tipoFinal,
      recursoId: recursoFinal,
      descripcion,
      metadata: {
        metodo: req.method,
        ruta,
        estado: res.statusCode,
        ...(tipoFinal !== tipo ? { recursoOrigen: tipo } : {}),
        ...(numero ? { numero } : {}),
      },
    });
  });

  return next();
}

module.exports = { auditoriaMiddleware, analizarRuta, resolverAccion };
