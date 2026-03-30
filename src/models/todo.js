import db from "../db.js";

export const getAllTodos = async () => {
  const rows = await db.all("SELECT * FROM todos ORDER BY date ASC, createdAt DESC");
  return rows || [];
};

export const getTodoById = async (id) => {
  return await db.get("SELECT * FROM todos WHERE id = ?", [id]);
};

export const createTodo = async (todoData) => {
  const { name, status, date } = todoData;
  const result = await db.run(
    "INSERT INTO todos (name, status, date) VALUES (?, ?, ?)",
    [name, status || "pending", date || null],
  );
  return { id: result.lastID, ...todoData, status: status || "pending" };
};

export const updateTodo = async (id, todoData) => {
  const { name, status, date } = todoData;
  await db.run(
    `UPDATE todos SET name = ?, status = ?, date = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, status, date, id],
  );
  return { id, ...todoData };
};

export const patchTodo = async (id, partialData) => {
  const allowedFields = ["name", "status", "date"];
  const fields = Object.keys(partialData).filter((field) =>
    allowedFields.includes(field),
  );

  if (fields.length === 0) return await getTodoById(id);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = fields.map((field) => partialData[field]);
  params.push(id);

  await db.run(
    `UPDATE todos SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    params,
  );

  return await getTodoById(id);
};

export const deleteTodo = async (id) => {
  const result = await db.run("DELETE FROM todos WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};
