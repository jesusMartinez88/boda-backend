import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import {
  checkUsernameLimiter,
  withConstantLatency,
} from "../middleware/checkUsername.js";

const router = express.Router();

// Limitador estricto para login + register: 10 req / hora.
// NO se aplica a check-username, que tiene su propio limitador más permisivo
// (checkUsernameLimiter) y se ejecuta solo al submit del form.
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // `ipKeyGenerator` espera un string (la IP), no el Request.
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: "Too many login attempts, please try again in an hour.",
  },
});

// Limitador para solicitud de códigos de restablecimiento: 5 req / 15 min
const resetCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    message:
      "Demasiadas solicitudes de código. Por favor, intenta de nuevo en unos minutos.",
  },
});

router.post("/login", authLimiter, authController.login);
router.post("/register", authLimiter, authController.register);
router.get(
  "/check-username",
  checkUsernameLimiter,
  withConstantLatency(authController.checkUsername),
);

// Rutas protegidas
router.get("/me", authenticateJWT, authController.me);
router.patch("/me/password", authenticateJWT, authController.changePassword);
router.patch(
  "/me",
  authenticateJWT,
  resetCodeLimiter,
  authController.updateMe,
);
router.post(
  "/me/request-reset-code",
  authenticateJWT,
  resetCodeLimiter,
  authController.requestResetCode,
);
router.post(
  "/me/reset-password-with-code",
  authenticateJWT,
  authController.resetPasswordWithCode,
);

export default router;
