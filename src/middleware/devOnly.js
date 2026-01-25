/**
 * Middleware para proteger endpoints de desarrollo
 */

export const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "This endpoint is only available in development mode",
    });
  }
  next();
};
