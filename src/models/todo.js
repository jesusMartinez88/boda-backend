import db from "../db.js";

export const getAllTodos = async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM todos ORDER BY date ASC, createdAt DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const getTodoById = async (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM todos WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const createTodo = async (todoData) => {
  const { name, status, date } = todoData;
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO todos (name, status, date) VALUES (?, ?, ?)",
      [name, status || 'pending', date || null],
      function (err) {
        if (err) reject(err);
        else {
          resolve({ id: this.lastID, ...todoData, status: status || 'pending' });
        }
      }
    );
  });
};

export const updateTodo = async (id, todoData) => {
  const { name, status, date } = todoData;
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE todos SET name = ?, status = ?, date = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, status, date, id],
      function (err) {
        if (err) reject(err);
        else {
          resolve({ id, ...todoData });
        }
      }
    );
  });
};

export const patchTodo = async (id, partialData) => {
  const allowedFields = ["name", "status", "date"];
  const fields = Object.keys(partialData).filter((field) =>
    allowedFields.includes(field)
  );
  
  if (fields.length === 0) return await getTodoById(id);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = fields.map((field) => partialData[field]);
  params.push(id);

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE todos SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
      async function (err) {
        if (err) reject(err);
        else {
          const updated = await getTodoById(id);
          resolve(updated);
        }
      }
    );
  });
};

export const deleteTodo = async (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM todos WHERE id = ?", [id], function (err) {
      if (err) reject(err);
      else {
        resolve({ deletedId: id, changes: this.changes });
      }
    });
  });
};
