import express from "express";
import * as guestController from "../controllers/guestController.js";
import { devOnly } from "../middleware/devOnly.js";

const router = express.Router();

// Estadísticas generales
router.get("/", guestController.getStats);

// Estadísticas específicas
router.get("/attendance", guestController.getAttendanceStats);
router.get("/transportation", guestController.getTransportationStats);
router.get("/allergies", guestController.getAllergiesStats);
// Reset database (development only)
router.post("/reset", devOnly, guestController.resetDatabase);
export default router;
