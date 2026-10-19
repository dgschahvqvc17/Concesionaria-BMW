const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const clienteComercialRepository = require('../repositories/clienteComercialRepository');

function normalizarEmail(email) {
  return (email || '').toString().trim().toLowerCase();
}

async function listClientes() {
  const clientes = await clienteComercialRepository.listAll();
  clientes.sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''));
  return clientes;
}

async function getCliente(clienteId) {
  const c = await clienteComercialRepository.findById(clienteId);
  if (!c) throw new NotFoundError('Cliente comercial no encontrado.');
  return c;
}

async function createCliente(datos) {
  const emailNorm = normalizarEmail(datos.email);
  const doc = datos.documento.toString().trim();

  const porEmail = await clienteComercialRepository.findByEmail(emailNorm);
  if (porEmail) throw new ConflictError('Ya existe un cliente con ese correo electrónico.');
  const porDoc = await clienteComercialRepository.findByDocumento(doc);
  if (porDoc) throw new ConflictError('Ya existe un cliente con ese documento de identidad.');

  const creado = await clienteComercialRepository.save({
    ...datos,
    email: emailNorm,
    documento: doc,
    estadoSeguimiento: datos.estadoSeguimiento || 'nuevo',
    consultas: datos.consultas || [],
  });
  return creado;
}

async function updateCliente(clienteId, datos) {
  await getCliente(clienteId);

  const updates = { ...datos };
  if (updates.email !== undefined) {
    updates.email = normalizarEmail(updates.email);
    const e = await clienteComercialRepository.findByEmail(updates.email);
    if (e && e.clienteId !== clienteId) throw new ConflictError('Ya existe un cliente con ese correo electrónico.');
  }
  if (updates.documento !== undefined) {
    updates.documento = updates.documento.toString().trim();
    const d = await clienteComercialRepository.findByDocumento(updates.documento);
    if (d && d.clienteId !== clienteId) throw new ConflictError('Ya existe un cliente con ese documento de identidad.');
  }
  const actualizado = await clienteComercialRepository.update(clienteId, updates);
  return actualizado;
}

async function addConsulta(clienteId, consulta) {
  const cliente = await getCliente(clienteId);
  const consultas = Array.isArray(cliente.consultas) ? cliente.consultas.slice() : [];
  consultas.push({ ...consulta, fecha: consulta.fecha || new Date().toISOString() });
  return clienteComercialRepository.update(clienteId, { consultas });
}

module.exports = { listClientes, getCliente, createCliente, updateCliente, addConsulta };
