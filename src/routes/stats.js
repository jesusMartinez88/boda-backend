import express from "express";
import * as guestController from "../controllers/guestController.js";
import { devOnly } from "../middleware/devOnly.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all stats routes
router.use(authenticateJWT);

// Estadísticas generales
router.get("/", guestController.getStats);

// Estadísticas específicas
router.get("/attendance", guestController.getAttendanceStats);
router.get("/transportation", guestController.getTransportationStats);
router.get("/allergies", guestController.getAllergiesStats);
// Reset database (development only)
router.post("/reset", devOnly, guestController.resetDatabase);
export default router;
