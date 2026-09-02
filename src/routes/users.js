import express from "express";
import * as userController from "../controllers/userController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole("admin")); // Solo administradores pueden gestionar usuarios

router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.patch("/:id/role", userController.updateUserRole);
router.delete("/:id", userController.deleteUser);

export default router;
