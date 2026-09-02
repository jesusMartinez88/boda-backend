import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

// Rutas protegidas
router.get("/me", authenticateJWT, authController.me);
router.patch("/me/password", authenticateJWT, authController.changePassword);

export default router;
