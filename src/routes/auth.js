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
  // `ipKeyGenerator` para pasar la validación IPv6 de express-rate-limit v7+.
  keyGenerator: ipKeyGenerator,
  message: {
    success: false,
    message: "Too many login attempts, please try again in an hour.",
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

export default router;
