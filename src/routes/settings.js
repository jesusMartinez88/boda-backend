import express from "express";
import * as settingController from "../controllers/settingController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = express.Router();

// All settings routes are protected
router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", settingController.getSettings);
router.put("/:key", settingController.updateSetting);

export default router;
