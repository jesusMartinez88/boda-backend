import express from "express";
import * as adminController from "../controllers/adminController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole("admin"));

router.get("/users", adminController.listUsersWithStats);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;
