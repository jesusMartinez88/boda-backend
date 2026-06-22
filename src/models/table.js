import db from "../db.js";

export const getNextTableName = async () => {
  // Buscar el valor numérico más alto en nombres que sigan el patrón "Mesa X"
  const rows = await db.all(
    `
    SELECT name FROM (
      SELECT name FROM tables
      UNION
      SELECT tableId as name FROM guests
    ) WHERE name LIKE 'Mesa %'
  `,
  );

  let maxNum = 0;
  rows.forEach((row) => {
    const match = row.name.match(/^Mesa (\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `Mesa ${maxNum + 1}`;
};

export const getAllTables = async () => {
  const rows = await db.all("SELECT * FROM tables ORDER BY name ASC");
  return rows || [];
};

export const getTableByName = async (name) => {
  return await db.get("SELECT * FROM tables WHERE name = ?", [name]);
};

export const getTableById = async (id) => {
  return await db.get("SELECT * FROM tables WHERE id = ?", [id]);
};

export const createTable = async (tableData) => {
  const { name, capacity, shape, posX, posY, captainId } = tableData;
  const result = await db.run(
    "INSERT INTO tables (name, capacity, shape, posX, posY, captainId) VALUES (?, ?, ?, ?, ?, ?)",
    [name, capacity, shape || "round", posX || 0, posY || 0, captainId ?? null],
  );
  return { id: result.lastID, ...tableData };
};

export const updateTableById = async (id, tableData) => {
  const { name, capacity, shape, posX, posY, captainId } = tableData;
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
  if (posX !== undefined) {
    fields.push("posX = ?");
    params.push(posX);
  }
  if (posY !== undefined) {
    fields.push("posY = ?");
    params.push(posY);
  }
  // captainId puede ser null (quitar capitán) o un número (asignar)
  if ("captainId" in tableData) {
    fields.push("captainId = ?");
    params.push(captainId ?? null);
  }

  if (fields.length === 0) return { id, changes: 0 };

  params.push(id);

  const result = await db.run(
    `UPDATE tables SET ${fields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    params,
  );
  return { id, changes: result.changes };
};

export const deleteTableById = async (id) => {
  const result = await db.run("DELETE FROM tables WHERE id = ?", [id]);
  return { id, changes: result.changes };
};

export const deleteTableByName = async (name) => {
  const result = await db.run("DELETE FROM tables WHERE name = ?", [name]);
  return { name, changes: result.changes };
};

// elimina todas las mesas de la tabla y reinicia el contador autoincrement
export const deleteAllTables = async () => {
  await db.run("DELETE FROM tables");
  await db.run("DELETE FROM sqlite_sequence WHERE name = 'tables'");
  return { deletedAll: true, resetSeq: true };
};
