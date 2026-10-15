/** Envuelve un handler async y delega cualquier rechazo al manejador de errores. */
function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
