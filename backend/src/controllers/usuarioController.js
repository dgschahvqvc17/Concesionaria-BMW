const usuarioService = require('../services/usuarioService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validate, createUsuarioSchema, updateUsuarioSchema, setEstadoSchema } = require('../validation/usuarioSchemas');

/** GET /api/usuarios */
const list = asyncHandler(async (req, res) => {
  const usuarios = await usuarioService.listUsuarios();
  res.json({ total: usuarios.length, usuarios });
});

/** GET /api/usuarios/:userId */
const getOne = asyncHandler(async (req, res) => {
  const usuario = await usuarioService.getUsuario(req.params.userId);
  res.json({ usuario });
});

/** POST /api/usuarios */
const create = asyncHandler(async (req, res) => {
  const data = validate(createUsuarioSchema, req.body);
  const usuario = await usuarioService.createUsuario(data, req.auth);
  res.status(201).json({ message: 'Usuario registrado correctamente.', usuario });
});

/** PATCH /api/usuarios/:userId */
const update = asyncHandler(async (req, res) => {
  const data = validate(updateUsuarioSchema, req.body);
  const usuario = await usuarioService.updateUsuario(req.params.userId, data, req.auth);
  res.json({ message: 'Usuario actualizado correctamente.', usuario });
});

/** PATCH /api/usuarios/:userId/estado */
const changeEstado = asyncHandler(async (req, res) => {
  const { estado } = validate(setEstadoSchema, req.body);
  const usuario = await usuarioService.setEstado(req.params.userId, estado, req.auth);
  const message = estado === 'activo' ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.';
  res.json({ message, usuario });
});

module.exports = { list, getOne, create, update, changeEstado };
