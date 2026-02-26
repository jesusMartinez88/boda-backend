import db from "../db.js";

export const getNextTableName = () => {
  return new Promise((resolve, reject) => {
    // Buscar el valor numérico más alto en nombres que sigan el patrón "Mesa X"
    db.all(`
      SELECT name FROM (
        SELECT name FROM tables
        UNION
        SELECT tableName as name FROM guests
      ) WHERE name LIKE 'Mesa %'
    `, [], (err, rows) => {
      if (err) return reject(err);
      
      let maxNum = 0;
      rows.forEach(row => {
        const match = row.name.match(/^Mesa (\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      
      resolve(`Mesa ${maxNum + 1}`);
    });
  });
};

export const getAllTables = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM tables ORDER BY name ASC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const getTableByName = (name) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM tables WHERE name = ?", [name], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getTableById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM tables WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const createTable = (tableData) => {
  const { name, capacity, shape } = tableData;
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO tables (name, capacity, shape) VALUES (?, ?, ?)",
      [name, capacity, shape || 'round'],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...tableData });
      }
    );
  });
};

export const updateTableById = (id, tableData) => {
  const { name, capacity, shape } = tableData;
  const fields = [];
  const params = [];
  
  if (name !== undefined) {
    fields.push("name = ?");
    params.push(name);
  }
  if (capacity !== undefined) {
    fields.push("capacity = ?");
    params.push(capacity);
  }
  if (shape !== undefined) {
    fields.push("shape = ?");
    params.push(shape);
  }
  
  if (fields.length === 0) return Promise.resolve({ id, changes: 0 });
  
  params.push(id);
  
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tables SET ${fields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
      function (err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      }
    );
  });
};

export const deleteTableById = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM tables WHERE id = ?", [id], function (err) {
      if (err) reject(err);
      else resolve({ id, changes: this.changes });
    });
  });
};

export const deleteTableByName = (name) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM tables WHERE name = ?", [name], function (err) {
      if (err) reject(err);
      else resolve({ name, changes: this.changes });
    });
  });
};
