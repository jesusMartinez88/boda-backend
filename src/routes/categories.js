import { Router } from "express";
import * as CategoryController from "../controllers/categoryController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = Router();

router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", CategoryController.getCategories);
router.post("/", CategoryController.createCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
