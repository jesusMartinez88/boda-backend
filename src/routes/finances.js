import express from "express";
import * as FinanceController from "../controllers/financeController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = express.Router();

// Todas las rutas de finanzas requieren autenticación
router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", FinanceController.getFinances);
router.get("/:id", FinanceController.getFinance);
router.post("/", FinanceController.createFinance);
router.patch("/:id", FinanceController.updateFinance);
router.delete("/:id", FinanceController.deleteFinance);

export default router;
