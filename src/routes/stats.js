import express from "express";
import * as guestController from "../controllers/guestController.js";

const router = express.Router();

// Estadísticas generales
router.get("/", guestController.getStats);

// Estadísticas específicas
router.get("/attendance", guestController.getAttendanceStats);
router.get("/transportation", guestController.getTransportationStats);
router.get("/allergies", guestController.getAllergiesStats);

export default router;
