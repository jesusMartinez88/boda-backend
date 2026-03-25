import * as Todo from "../src/models/todo.js";
import db from "../src/db.js";

async function verifyModel() {
  console.log("🧪 Verificando Modelo Todo...");
  
  try {
    // 1. Crear
    const newTodo = await Todo.createTodo({
      name: "Prueba de Integración",
      date: "2026-12-31"
    });
    console.log("✅ Todo creado:", newTodo);

    // 2. Listar
    const todos = await Todo.getAllTodos();
    console.log("✅ Lista de todos:", todos.length, "encontrados");

    // 3. Obtener por ID
    const found = await Todo.getTodoById(newTodo.id);
    console.log("✅ Todo encontrado por ID:", found.name);

    // 4. Actualizar
    const updated = await Todo.updateTodo(newTodo.id, {
      name: "Nombre Actualizado",
      status: "completed",
      date: "2026-12-31"
    });
    console.log("✅ Todo actualizado:", updated.name, "-", updated.status);

    // 5. Parchear
    const patched = await Todo.patchTodo(newTodo.id, { status: "pending" });
    console.log("✅ Todo parcheado:", patched.status);

    // 6. Eliminar
    const deleted = await Todo.deleteTodo(newTodo.id);
    console.log("✅ Todo eliminado:", deleted);

    console.log("\n🎉 Verificación del modelo completada con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en la verificación:", error);
    process.exit(1);
  }
}

// Esperar a que la DB inicialice (db.js corre initializeTables al conectar)
setTimeout(verifyModel, 1000);
