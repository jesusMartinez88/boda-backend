import { Router } from "express";
import * as ContactController from "../controllers/contactController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = Router();

// Todas las rutas de contactos requieren autenticación
router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", ContactController.getContacts);
router.post("/", ContactController.createContact);
router.patch("/:id", ContactController.patchContact);
router.delete("/:id", ContactController.deleteContact);

export default router;
