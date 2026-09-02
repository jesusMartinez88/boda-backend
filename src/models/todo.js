import db from "../db.js";

export const getAllTodos = async (userId) => {
  const rows = await db.all(
    "SELECT * FROM todos WHERE userId = ? ORDER BY date ASC, createdAt DESC",
    [userId],
  );
  return rows || [];
};

export const getTodoById = async (id, userId) => {
  if (userId !== undefined) {
    return await db.get("SELECT * FROM todos WHERE id = ? AND userId = ?", [id, userId]);
  }
  return await db.get("SELECT * FROM todos WHERE id = ?", [id]);
};

export const createTodo = async (todoData) => {
  const { userId, name, status, date } = todoData;
  const result = await db.run(
    "INSERT INTO todos (userId, name, status, date) VALUES (?, ?, ?, ?)",
    [userId || null, name, status || "pending", date || null],
  );
  return { id: result.lastID, ...todoData, status: status || "pending" };
};

export const updateTodo = async (id, todoData, userId) => {
  const { name, status, date } = todoData;
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [name, status, date, id, userId] : [name, status, date, id];
  await db.run(
    `UPDATE todos SET name = ?, status = ?, date = ?, updatedAt = CURRENT_TIMESTAMP ${whereClause}`,
    params,
  );
  return { id, ...todoData };
};

export const patchTodo = async (id, partialData, userId) => {
  const allowedFields = ["name", "status", "date"];
  const fields = Object.keys(partialData).filter((field) =>
    allowedFields.includes(field),
  );

  if (fields.length === 0) return await getTodoById(id, userId);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = fields.map((field) => partialData[field]);

  if (userId !== undefined) {
    params.push(id, userId);
    await db.run(
      `UPDATE todos SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
      params,
    );
  } else {
    params.push(id);
    await db.run(
      `UPDATE todos SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
    );
  }

  return await getTodoById(id, userId);
};

export const deleteTodo = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  const result = await db.run(`DELETE FROM todos ${whereClause}`, params);
  return { deletedId: id, changes: result.changes };
};
