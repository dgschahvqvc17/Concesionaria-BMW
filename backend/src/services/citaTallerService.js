const { NotFoundError, ConflictError, ForbiddenError } = require('../errors/AppError');
const citaTallerRepository = require('../repositories/citaTallerRepository');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');
const vehiculoRepository = require('../repositories/vehiculoRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const repuestoRepository = require('../repositories/repuestoRepository');
const movimientoService = require('./movimientoService');
const notificacionService = require('./notificacionService');
const storageService = require('./storageService');
const { registrarSinFallo } = notificacionService;
const { DURACION_DEFECTO, TIPOS_SERVICIO, ESTADOS_CITA_AVANCE } = require('../validation/citaTallerSchemas');

/** Citas que ocupan un horario del taller (aún no finalizadas ni canceladas). */
const ESTADOS_CITA_OCUPADOS = ['solicitada', 'confirmada', 'en_atencion'];

/** Estados en los que la cita admite asignación o reasignación de mecánico (HU14). */
const ESTADOS_CITA_ASIGNABLES = ['confirmada', 'en_atencion'];

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

/**
 * El mecánico debe existir en Usuarios, tener el rol `mecanico` y estar activo:
 * las asignaciones a usuarios inactivos quedan bloqueadas (HU14).
 */
async function resolverMecanico(mecanicoId) {
  const mecanico = await usuarioRepository.findById(mecanicoId);
  if (!mecanico) throw new NotFoundError('El mecánico no existe.');
  if (mecanico.rol !== 'mecanico') {
    throw new ConflictError('El usuario seleccionado no tiene el rol de mecánico.');
  }
  if (mecanico.estado !== 'activo') {
    throw new ConflictError('No se puede asignar trabajo a un mecánico inactivo.');
  }
  return mecanico;
}

function resumenMecanico(usuario) {
  return {
    userId: usuario.userId,
    nombre: usuario.nombre,
    email: usuario.email,
  };
}

/** Añade la URL prefirmada de lectura a cada archivo técnico de la orden (HU15). */
async function toResponse(cita) {
  const archivos = cita.archivos ?? [];
  return {
    ...cita,
    archivos: await Promise.all(
      archivos.map(async (archivo) => ({
        ...archivo,
        url: await storageService.createViewUrl(archivo.key),
      }))
    ),
  };
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

async function listCitas({ clienteId, vehiculoId, mecanicoId, estado, fechaDesde, fechaHasta } = {}) {
  let citas;
  if (mecanicoId) citas = await citaTallerRepository.findByMecanico(mecanicoId);
  else if (clienteId) citas = await citaTallerRepository.findByCliente(clienteId);
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
  assertPuedeRegistrar(cita, actor);
  assertEstado(cita, ['confirmada'], 'iniciar la atención de');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'en_atencion',
    fechaInicioReal: cita.fechaInicioReal ?? new Date().toISOString(),
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
  assertPuedeRegistrar(cita, actor);
  assertEstado(cita, ['en_atencion'], 'finalizar');

  const actualizada = await citaTallerRepository.update(citaId, {
    estado: 'finalizada',
    fechaFinReal: new Date().toISOString(),
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

/**
 * Asigna (o reasigna) un mecánico responsable a la cita (HU14).
 * Solo procede sobre citas `confirmada`/`en_atencion`; registra la fecha de
 * asignación y el historial de cambios, y notifica al mecánico por correo.
 */
async function asignarMecanico(citaId, datos, actor = {}) {
  const cita = await getCita(citaId);
  assertEstado(cita, ESTADOS_CITA_ASIGNABLES, 'asignar un mecánico a');

  const mecanico = await resolverMecanico(datos.mecanicoId);

  if (cita.mecanicoId === mecanico.userId) {
    throw new ConflictError('La cita ya está asignada a ese mecánico.');
  }

  const reasignada = Boolean(cita.mecanicoId);
  const fecha = new Date().toISOString();
  const entrada = {
    mecanicoId: mecanico.userId,
    mecanicoNombre: mecanico.nombre,
    tipo: reasignada ? 'reasignada' : 'asignada',
    fecha,
    usuario: autorNombre(actor),
    ...(datos.observaciones ? { observaciones: datos.observaciones } : {}),
  };

  const actualizada = await citaTallerRepository.update(citaId, {
    mecanicoId: mecanico.userId,
    mecanico: resumenMecanico(mecanico),
    asignadoAt: fecha,
    asignaciones: [...(cita.asignaciones ?? []), entrada],
  });

  await registrarSinFallo(() =>
    notificacionService.notificarMecanico(actualizada, reasignada ? 'cita_reasignada' : 'cita_asignada')
  );
  return actualizada;
}

/** El jefe de taller y el administrador pueden actuar sobre cualquier orden (HU15). */
function esGestor(actor) {
  const roles = actor?.roles ?? [];
  return roles.some((rol) => rol === 'admin' || rol === 'jefe_taller');
}

/**
 * El mecánico solo documenta avances en las órdenes asignadas a su persona;
 * el jefe de taller y el administrador pueden autorizar sobre cualquiera (HU15).
 */
function assertPuedeRegistrar(cita, actor) {
  if (esGestor(actor)) return;
  if (cita.mecanicoId !== actor?.sub) {
    throw new ForbiddenError('Solo puede registrar avances en las órdenes asignadas a su persona.');
  }
}

/** Autoriza la subida de archivos técnicos de una orden (HU15). */
function assertPuedeCargarArchivos(cita, actor) {
  assertPuedeRegistrar(cita, actor);
}

/**
 * Descuenta las existencias de cada repuesto utilizado registrando un
 * movimiento de salida (HU04). Si un repuesto no existe responde 404 y si
 * no hay existencias suficientes responde 409 (`adjustStock` atómico).
 */
async function consumirRepuestos(repuestos, actor) {
  const usados = [];
  for (const item of repuestos) {
    const repuesto = await repuestoRepository.findById(item.repuestoId);
    if (!repuesto) throw new NotFoundError('Uno de los repuestos utilizados no existe.');

    const { repuesto: actualizado } = await movimientoService.registrarMovimiento(
      {
        repuestoId: repuesto.repuestoId,
        tipo: 'salida',
        cantidad: item.cantidad,
        motivo: 'Consumo en orden de taller',
      },
      actor
    );

    usados.push({
      repuestoId: repuesto.repuestoId,
      codigo: repuesto.codigo,
      nombre: repuesto.nombre,
      cantidad: item.cantidad,
      precioUnitario: repuesto.precio,
      cantidadResultante: actualizado?.cantidad ?? null,
    });
  }
  return usados;
}

/** Verifica en S3 los archivos técnicos nuevos y guarda su metadata autoritativa. */
async function registrarArchivosTaller(archivos, actor, ahora) {
  const resultado = [];
  for (const archivo of archivos ?? []) {
    const categoria = archivo.categoria === 'taller_foto' ? 'taller_foto' : 'taller_documento';
    const { contentType, size } = await storageService.assertArchivo(archivo.key, categoria);
    resultado.push({
      key: archivo.key,
      nombre: archivo.nombre,
      categoria,
      contentType,
      size,
      uploadedAt: ahora,
      uploadedBy: actor?.sub ?? null,
    });
  }
  return resultado;
}

/**
 * Registra el avance del mantenimiento o reparación que documenta el mecánico:
 * diagnóstico, tareas, repuestos utilizados (descuenta existencias),
 * observaciones técnicas y archivos (HU15). Solo el mecánico asignado o un
 * gestor puede registrar; no se admite sobre órdenes finalizadas/canceladas.
 */
async function registrarAvance(citaId, datos, actor = {}) {
  const cita = await getCita(citaId);
  assertPuedeRegistrar(cita, actor);
  assertEstado(cita, ESTADOS_CITA_AVANCE, 'registrar avances en');

  const ahora = new Date().toISOString();
  const repuestosNuevos = await consumirRepuestos(datos.repuestosUtilizados ?? [], actor);
  const archivosNuevos = await registrarArchivosTaller(datos.archivos ?? [], actor, ahora);

  const tareasNuevas = (datos.tareas ?? []).map((tarea) => ({
    descripcion: tarea.descripcion,
    realizada: tarea.realizada ?? true,
    fecha: ahora,
    usuario: autorNombre(actor),
  }));

  const actualizada = await citaTallerRepository.update(citaId, {
    diagnostico: datos.diagnostico ?? cita.diagnostico,
    observacionesTecnicas: datos.observacionesTecnicas ?? cita.observacionesTecnicas,
    tareas: [...(cita.tareas ?? []), ...tareasNuevas],
    repuestosUtilizados: [...(cita.repuestosUtilizados ?? []), ...repuestosNuevos],
    archivos: [...(cita.archivos ?? []), ...archivosNuevos],
    ultimoAvanceAt: ahora,
  });

  return actualizada;
}

/** Genera una URL prefirmada para subir un archivo técnico de la orden (HU15). */
async function presignArchivoTaller(citaId, payload, actor = {}) {
  const cita = await getCita(citaId);
  assertPuedeCargarArchivos(cita, actor);
  return storageService.createUploadUrl(payload);
}

module.exports = {
  ESTADOS_CITA_OCUPADOS,
  ESTADOS_CITA_ASIGNABLES,
  tipoServicioEtiqueta,
  createCita,
  listCitas,
  getCita,
  confirmarCita,
  reprogramarCita,
  iniciarCita,
  finalizarCita,
  cancelarCita,
  asignarMecanico,
  registrarAvance,
  presignArchivoTaller,
  toResponse,
};
