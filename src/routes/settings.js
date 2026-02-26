import express from "express";
import * as settingController from "../controllers/settingController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// All settings routes are protected
router.use(authenticateJWT);

router.get("/", settingController.getSettings);
router.put("/:key", settingController.updateSetting);

export default router;
