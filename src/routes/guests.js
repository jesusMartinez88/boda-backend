import express from "express";
import * as guestController from "../controllers/guestController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = express.Router();

// Rutas públicas con :userSlug
router.get("/public/:userSlug", resolveUserContext, guestController.getGuests);
router.get("/public/:userSlug/:id", resolveUserContext, guestController.getGuest);
router.post("/public/:userSlug", resolveUserContext, guestController.createGuest);

// Rutas protegidas (requieren login)
router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", guestController.getGuests);
router.get("/:id", guestController.getGuest);
router.post("/", guestController.createGuest);
router.put("/:id", guestController.updateGuest);
router.patch("/:id", guestController.patchGuest);
router.delete("/:id", guestController.deleteGuest);

// generar y enviar código de borrado masivo por email
router.post("/request-delete", guestController.requestDeleteCode);
// borrar todos los invitados (se requiere el código enviado por email)
router.delete("/bulk", guestController.deleteAllGuests);

export default router;
