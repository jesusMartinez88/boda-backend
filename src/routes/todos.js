import express from "express";
import * as todoController from "../controllers/todoController.js";
import { authenticateJWT } from "../middleware/auth.js";
import { resolveUserContext } from "../middleware/resolveUserContext.js";

const router = express.Router();

// Proteger todas las rutas de todos
router.use(authenticateJWT);
router.use(resolveUserContext);

router.get("/", todoController.getTodos);
router.get("/:id", todoController.getTodo);
router.post("/", todoController.createTodo);
router.put("/:id", todoController.updateTodo);
router.patch("/:id", todoController.patchTodo);
router.delete("/:id", todoController.deleteTodo);

export default router;
