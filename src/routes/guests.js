import express from "express";
import * as guestController from "../controllers/guestController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Rutas públicas
router.get("/", guestController.getGuests);
router.get("/:id", guestController.getGuest);
router.post("/", guestController.createGuest);

// Rutas protegidas (requieren login)
router.use(authenticateJWT);
// generar y enviar código de borrado masivo por email
// borrar todos los invitados (se requiere el código enviado por email)
router.post("/request-delete", guestController.requestDeleteCode);
router.delete("/", guestController.deleteAllGuests);
router.put("/:id", guestController.updateGuest);
router.patch("/:id", guestController.patchGuest);
router.delete("/:id", guestController.deleteGuest);

export default router;
