import express from "express";
import * as FinanceController from "../controllers/financeController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas de finanzas requieren autenticación
router.use(authenticateJWT);

router.get("/", FinanceController.getFinances);
router.get("/:id", FinanceController.getFinance);
router.post("/", FinanceController.createFinance);
router.put("/:id", FinanceController.updateFinance);
router.delete("/:id", FinanceController.deleteFinance);

export default router;
