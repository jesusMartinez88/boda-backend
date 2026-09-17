import { Router } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import * as ContactMessageController from "../controllers/contactMessageController.js";

const router = Router();

// Rate-limit dedicado para el formulario público. Más estricto que el
// `generalLimiter` global porque no requiere autenticación y es un vector
// potencial de spam/abuso.
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    error:
      "Has enviado demasiados mensajes en poco tiempo. Vuelve a intentarlo en unos minutos.",
  },
});

// Aplicamos el limiter únicamente a esta ruta. El `generalLimiter` global
// (en src/app.js) sigue contando sobre la misma IP, pero el más restrictivo
// (5 / 15min) es el que corta primero.
router.post("/", contactFormLimiter, ContactMessageController.createContactMessage);

export default router;
