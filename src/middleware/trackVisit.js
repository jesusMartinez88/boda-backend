import * as Visit from "../models/visit.js";

/**
 * Middleware que registra una visita única (por IP) para el slug del
 * parámetro de ruta `:userSlug`.
 *
 * - Non-blocking: el tracking ocurre en background; un fallo aquí nunca
 *   interrumpe la respuesta al cliente.
 * - Deduplica en el modelo: la misma IP + slug en 24 h solo cuenta una vez.
 * - Extrae la IP real respetando el proxy inverso (Express `trust proxy = 1`
 *   ya está activo en app.js, así que `req.ip` ya es la IP del cliente).
 */
export const trackVisit = (req, _res, next) => {
  const slug = req.params.userSlug;
  if (slug) {
    const ip = req.ip ?? "unknown";
    const ua = req.headers["user-agent"] ?? null;
    // Fire-and-forget: no awaited, no blocking.
    Visit.track(slug, ip, ua).catch((err) => {
      console.warn("[trackVisit] failed to record visit:", err?.message);
    });
  }
  next();
};
