import express from "express";
import * as tableController from "../controllers/tableController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// All tables routes are protected
router.use(authenticateJWT);

router.get("/", tableController.getTables);
router.get("/:id", tableController.getTable);
router.post("/", tableController.createTable);
router.patch("/:id", tableController.updateTable);
router.delete("/:id", tableController.deleteTable);

export default router;
