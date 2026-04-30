import { Router } from "express";
import * as CategoryController from "../controllers/categoryController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = Router();

router.use(authenticateJWT);

router.get("/", CategoryController.getCategories);
router.post("/", CategoryController.createCategory);
router.delete("/:id", CategoryController.deleteCategory);

export default router;
