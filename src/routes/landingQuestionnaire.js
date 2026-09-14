import express from "express";
import * as controller from "../controllers/landingQuestionnaireController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas del cuestionario del propio usuario requieren auth.
// No usamos `resolveUserContext` porque el id sale directamente del JWT
// (evita fugas: el usuario solo puede ver/editar SU cuestionario).
router.use(authenticateJWT);

router.get("/", controller.getMine);
router.put("/", controller.saveMine);

export default router;