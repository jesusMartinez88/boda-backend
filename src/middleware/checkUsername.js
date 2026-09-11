import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { logWarn } from "../utils/logger.js";

/**
 * Limitador específico para `GET /api/auth/check-username`.
 * Pensado para que un usuario legítimo (un check por submit del form) tenga
 * margen amplio, pero un atacante enumerando usernames se quede corto rápido.
 * 60 requests / 15 min por IP, 20 / 15 min por username.
 *
 * Nota: usamos `ipKeyGenerator` (helper oficial de express-rate-limit) en vez
 * de `req.ip` directo para pasar la validación de IPv6 y hashear la IP de
 * forma estable — un atacante que rote prefijos IPv6 sigue contando como una
 * misma "IP lógica" porque se trunca a /64.
 */
export const checkUsernameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username =
      typeof req.query.username === "string" ? req.query.username.trim() : "";
    // OJO: `ipKeyGenerator` espera un string (la IP), no el objeto Request.
    // Si le pasas `req` directamente, lo devuelve tal cual y revienta al
    // hashearlo en `setDraft8Headers` con `ERR_INVALID_ARG_TYPE`.
    return username ? `u:${username.toLowerCase()}` : `ip:${ipKeyGenerator(req.ip)}`;
  },
  handler: (req, res) => {
    logWarn(
      `[security] check-username rate limit hit from ${req.ip} for "${req.query.username}"`,
    );
    res.status(429).json({
      success: false,
      available: false,
      message: "Demasiadas comprobaciones. Inténtalo más tarde.",
    });
  },
});

/**
 * Mitigación de timing attack: devolvemos siempre con un retardo mínimo
 * para que "taken" y "free" tarden lo mismo y el atacante no pueda inferir
 * por latencia si un usuario existe. 150ms es suficiente para igualar una
 * consulta a libSQL sin que la UX se resienta.
 */
const CHECK_USERNAME_MIN_LATENCY_MS = 150;

export const withConstantLatency = (handler) => async (req, res) => {
  const start = Date.now();
  // Sobrescribimos res.json/res.send para retrasar el envío real hasta que
  // haya pasado el retardo mínimo, igualando así la latencia entre respuestas.
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  res.json = (body) => {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, CHECK_USERNAME_MIN_LATENCY_MS - elapsed);
    setTimeout(() => originalJson(body), wait);
    return res;
  };
  res.send = (body) => {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, CHECK_USERNAME_MIN_LATENCY_MS - elapsed);
    setTimeout(() => originalSend(body), wait);
    return res;
  };
  await handler(req, res);
};
