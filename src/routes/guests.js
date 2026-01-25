import express from "express";
import * as guestController from "../controllers/guestController.js";

const router = express.Router();

// Rutas de invitados
router.get("/", guestController.getGuests);
router.get("/:id", guestController.getGuest);
router.post("/", guestController.createGuest);
router.put("/:id", guestController.updateGuest);
router.delete("/:id", guestController.deleteGuest);

export default router;
