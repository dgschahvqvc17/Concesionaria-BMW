const usuarioRepository = require('../repositories/usuarioRepository');
const cognitoService = require('../services/cognitoService');
const { ConflictError, ForbiddenError, NotFoundError, ValidationError } = require('../errors/AppError');

const ESTADO_ACTIVO = 'activo';
const ESTADO_INACTIVO = 'inactivo';

/** Normaliza un correo (minúsculas y sin espacios). */
function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

/** Construye el objeto de perfil que se persiste en DynamoDB. */
function buildProfile({ userId, email, nombre, rol, estado, createdBy, fechaNacimiento, carnetIdentidad, celular }) {
  const now = new Date().toISOString();
  return {
    userId,
    email,
    nombre,
    rol,
    estado: estado ?? ESTADO_ACTIVO,
    ...(fechaNacimiento ? { fechaNacimiento } : {}),
    ...(carnetIdentidad ? { carnetIdentidad } : {}),
    ...(celular ? { celular } : {}),
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy ?? null,
  };
}

/**
 * Registra un nuevo usuario.
 * 1) valida correo único, 2) lo crea en Cognito, 3) lo asigna al grupo del rol,
 * 4) persiste el perfil. Si algo falla tras crear en Cognito, se elimina (compensación).
 */
async function createUsuario({ nombre, email, rol, password }, actor) {
  const normalizedEmail = normalizeEmail(email);

  const existente = await usuarioRepository.findByEmail(normalizedEmail);
  if (existente) {
    throw new ConflictError('El correo electrónico ya está registrado.');
  }

  await cognitoService.createUser({ email: normalizedEmail, nombre, password });

  try {
    const cognitoUser = await cognitoService.getUser(normalizedEmail);
    const userId = cognitoService.getAttribute(cognitoUser, 'sub');

    await cognitoService.setGroups(normalizedEmail, [rol]);

    const profile = buildProfile({
      userId,
      email: normalizedEmail,
      nombre,
      rol,
      estado: ESTADO_ACTIVO,
      createdBy: actor?.sub ?? null,
    });

    return await usuarioRepository.save(profile);
  } catch (error) {
    // Compensación: no dejar usuarios huérfanos en Cognito.
    await cognitoService.deleteUser(normalizedEmail).catch(() => {});
    throw error;
  }
}

/**
 * Autorregistro de un cliente desde el login.
 * Crea la cuenta en Cognito con el rol `cliente`, la asigna al grupo correspondiente
 * y persiste el perfil con los datos personales. Compensa eliminando en Cognito
 * si falla la persistencia.
 */
async function registrarCliente({ nombre, email, password, fechaNacimiento, carnetIdentidad, celular }) {
  const normalizedEmail = normalizeEmail(email);

  const existente = await usuarioRepository.findByEmail(normalizedEmail);
  if (existente) {
    throw new ConflictError('El correo electrónico ya está registrado.');
  }

  await cognitoService.createUser({ email: normalizedEmail, nombre, password });

  try {
    const cognitoUser = await cognitoService.getUser(normalizedEmail);
    const userId = cognitoService.getAttribute(cognitoUser, 'sub');

    await cognitoService.setGroups(normalizedEmail, ['cliente']);

    const profile = buildProfile({
      userId,
      email: normalizedEmail,
      nombre,
      rol: 'cliente',
      estado: ESTADO_ACTIVO,
      createdBy: userId,
      fechaNacimiento,
      carnetIdentidad,
      celular,
    });

    return await usuarioRepository.save(profile);
  } catch (error) {
    await cognitoService.deleteUser(normalizedEmail).catch(() => {});
    throw error;
  }
}

/** Actualiza nombre, rol y/o estado de un usuario existente. */
async function updateUsuario(userId, changes, actor) {
  const profile = await usuarioRepository.findById(userId);
  if (!profile) {
    throw new NotFoundError('El usuario no existe.');
  }

  const isSelf = actor?.sub === userId;

  // Los clientes se autorregistran: el administrador no puede crearlos ni cambiar su rol.
  if (profile.rol === 'cliente' && changes.rol && changes.rol !== profile.rol) {
    throw new ForbiddenError('Los clientes se autorregistran; no es posible cambiar su rol.');
  }

  if (changes.estado && changes.estado !== profile.estado) {
    if (isSelf && changes.estado === ESTADO_INACTIVO) {
      throw new ValidationError('No puedes desactivar tu propia cuenta.');
    }
    await cognitoService.setEnabled(profile.email, changes.estado === ESTADO_ACTIVO);
    profile.estado = changes.estado;
  }

  if (changes.rol && changes.rol !== profile.rol) {
    if (isSelf && profile.rol === 'admin') {
      throw new ValidationError('No puedes cambiar tu propio rol de administrador.');
    }
    await cognitoService.setGroups(profile.email, [changes.rol]);
    profile.rol = changes.rol;
  }

  if (changes.nombre && changes.nombre !== profile.nombre) {
    profile.nombre = changes.nombre;
  }

  profile.updatedAt = new Date().toISOString();
  profile.updatedBy = actor?.sub ?? null;

  return usuarioRepository.save(profile);
}

/** Cambia únicamente el estado (activar/desactivar). */
async function setEstado(userId, estado, actor) {
  return updateUsuario(userId, { estado }, actor);
}

/** Devuelve el perfil del usuario autenticado, creándolo si aún no existe. */
async function syncSession({ userId, email, nombre, rol }) {
  const existing = await usuarioRepository.findById(userId);

  if (existing) {
    if (existing.estado === ESTADO_INACTIVO) {
      throw new ForbiddenError('Tu cuenta está inactiva. Contacta a un administrador.');
    }
    return existing;
  }

  // Si el perfil no existe en DynamoDB (p. ej. usuario creado desde la consola),
  // lo creamos a partir de la información del ID token.
  const creado = buildProfile({
    userId,
    email: normalizeEmail(email),
    nombre,
    rol,
    estado: ESTADO_ACTIVO,
    createdBy: userId,
  });

  return usuarioRepository.save(creado);
}

/** Lista todos los usuarios ordenados alfabéticamente por nombre. */
async function listUsuarios() {
  const usuarios = await usuarioRepository.listAll();
  return usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Mecánicos activos disponibles para asignar trabajos (HU14). */
async function listMecanicos() {
  const usuarios = await usuarioRepository.listAll();
  return usuarios
    .filter((usuario) => usuario.rol === 'mecanico' && usuario.estado === 'activo')
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Obtiene un usuario por id. */
async function getUsuario(userId) {
  const profile = await usuarioRepository.findById(userId);
  if (!profile) {
    throw new NotFoundError('El usuario no existe.');
  }
  return profile;
}

module.exports = {
  createUsuario,
  registrarCliente,
  updateUsuario,
  setEstado,
  syncSession,
  listUsuarios,
  listMecanicos,
  getUsuario,
};
