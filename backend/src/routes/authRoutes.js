const express = require('express');

const { requireAuth } = require('../auth/middleware');
const { primaryRole } = require('../auth/roles');
const { asyncHandler } = require('../utils/asyncHandler');
const usuarioService = require('../services/usuarioService');

const router = express.Router();

/** GET /api/auth/session — devuelve el perfil del usuario autenticado. */
router.get(
  '/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = req.auth;

    const profile = await usuarioService.syncSession({
      userId: payload.sub,
      email: payload.email ?? '',
      nombre: payload.name ?? payload.email ?? 'Usuario',
      rol: primaryRole(req.authRoles),
    });

    res.json({
      userId: profile.userId,
      email: profile.email,
      nombre: profile.nombre,
      rol: profile.rol,
      estado: profile.estado,
    });
  })
);

module.exports = router;
