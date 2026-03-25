import express from "express";
import * as todoController from "../controllers/todoController.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Rutas públicas (opcional, podrías protegerlas todas)
router.get("/", todoController.getTodos);
router.get("/:id", todoController.getTodo);

// Rutas protegidas (requieren login para modificar)
router.post("/", authenticateJWT, todoController.createTodo);
router.put("/:id", authenticateJWT, todoController.updateTodo);
router.patch("/:id", authenticateJWT, todoController.patchTodo);
router.delete("/:id", authenticateJWT, todoController.deleteTodo);

export default router;
