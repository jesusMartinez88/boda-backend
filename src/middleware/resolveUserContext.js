import { findBySlug } from "../models/user.js";

/**
 * Middleware que resuelve el contexto de usuario desde el slug.
 * 
 * Para rutas públicas: extrae slug desde req.params.userSlug
 * Para rutas privadas: extrae slug desde req.user.slug (token JWT)
 * 
 * Monta req.userContext = { userId, slug } para uso en controladores.
 */
export const resolveUserContext = async (req, res, next) => {
  try {
    let slug;

    // Try URL param first (public routes)
    if (req.params.userSlug) {
      // Normalize slug: replace spaces with hyphens and lowercase
      slug = req.params.userSlug.trim().toLowerCase().replace(/\s+/g, "-");
    }
    // Then try token (private routes)
    else if (req.user?.slug) {
      slug = req.user.slug;
    }
    // No slug found
    else {
      return res.status(400).json({
        success: false,
        message: "User context required",
      });
    }

    // Resolve userId from slug
    const user = await findBySlug(slug);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Mount user context
    req.userContext = {
      userId: user.id,
      slug: user.slug,
    };

    next();
  } catch (error) {
    next(error);
  }
};
