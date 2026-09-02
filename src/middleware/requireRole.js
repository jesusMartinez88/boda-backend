/**
 * Middleware que verifica que el usuario autenticado tiene el rol requerido.
 * Debe usarse DESPUÉS de authenticateJWT.
 *
 * @param {...string} roles - Roles permitidos (ej: 'admin')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: insufficient permissions",
    });
  }
  next();
};
