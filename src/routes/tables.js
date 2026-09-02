import express from "express";
import * as tableController from "../controllers/tableController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = express.Router();

// All tables routes are protected
router.use(authenticateJWT);
router.use(resolveUserContext);

// generar y enviar código de borrado masivo por email
// borrar todas las mesas (se requiere el código enviado por email)
router.post("/request-delete", tableController.requestDeleteCode);
router.delete("/", tableController.deleteAllTables);
router.get("/", tableController.getTables);
router.get("/:id", tableController.getTable);
router.post("/", tableController.createTable);
router.patch("/:id", tableController.updateTable);
router.delete("/:id", tableController.deleteTable);

export default router;
