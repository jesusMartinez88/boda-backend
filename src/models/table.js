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
  // Parse captainIds from JSON string to array
  if (rows && rows.length > 0) {
    rows.forEach(row => {
      if (row.captainIds && typeof row.captainIds === 'string') {
        try {
          row.captainIds = JSON.parse(row.captainIds);
        } catch (e) {
          row.captainIds = null;
        }
      }
    });
  }
  return rows || [];
};

export const getTableByName = async (name) => {
  return await db.get("SELECT * FROM tables WHERE name = ?", [name]);
};

export const getTableById = async (id) => {
  const row = await db.get("SELECT * FROM tables WHERE id = ?", [id]);
  if (row && row.captainIds && typeof row.captainIds === 'string') {
    try {
      row.captainIds = JSON.parse(row.captainIds);
    } catch (e) {
      row.captainIds = null;
    }
  }
  return row;
};

export const createTable = async (tableData) => {
  const { name, capacity, shape, posX, posY, captainIds, rotation } = tableData;
  let captainIdsJson = null;
  if (captainIds && Array.isArray(captainIds)) {
    captainIdsJson = JSON.stringify(captainIds);
  }
  const result = await db.run(
    "INSERT INTO tables (name, capacity, shape, posX, posY, captainIds, rotation) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, capacity, shape || "round", posX || 0, posY || 0, captainIdsJson, rotation ?? 0],
  );
  return { id: result.lastID, ...tableData };
};

// Quita un captainId de TODAS las mesas excepto la mesa excludedId
export const removeCaptainFromAllOtherTables = async (captainId, excludedTableId) => {
  const tables = await db.all("SELECT id, captainIds FROM tables WHERE id != ?", [excludedTableId]);

  for (const table of tables) {
    if (!table.captainIds) continue;

    let currentIds = table.captainIds;
    if (typeof currentIds === "string") {
      try {
        currentIds = JSON.parse(currentIds);
      } catch (e) {
        continue;
      }
    }

    if (!Array.isArray(currentIds)) continue;

    const idx = currentIds.indexOf(Number(captainId));
    if (idx === -1) continue;

    currentIds.splice(idx, 1);
    const newJson = currentIds.length > 0 ? JSON.stringify(currentIds) : null;
    await db.run(
      "UPDATE tables SET captainIds = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [newJson, table.id],
    );
  }
};

export const updateTableById = async (id, tableData) => {
  const { name, capacity, shape, posX, posY, captainIds, rotation } = tableData;
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
  if (rotation !== undefined) {
    fields.push("rotation = ?");
    params.push(rotation);
  }

  if ("captainIds" in tableData) {
    // Obtener los captains actuales de esta mesa ANTES de actualizar
    const oldTable = await db.get("SELECT captainIds FROM tables WHERE id = ?", [id]);
    let oldCaptainIds = [];
    if (oldTable && oldTable.captainIds) {
      try {
        oldCaptainIds = JSON.parse(oldTable.captainIds);
      } catch (e) {}
    }

    let captainIdsJson = null;
    if (Array.isArray(captainIds)) {
      captainIdsJson = captainIds.length > 0 ? JSON.stringify(captainIds) : null;

      // 1) Quitar captains ANTERIORES de esta mesa de cualquier otra tabla
      for (const cid of oldCaptainIds) {
        await removeCaptainFromAllOtherTables(cid, id);
      }
      // 2) Quitar captains NUEVOS de cualquier otra tabla (evitar duplicados)
      for (const cid of captainIds) {
        await removeCaptainFromAllOtherTables(cid, id);
      }
    }

    fields.push("captainIds = ?");
    params.push(captainIdsJson);
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
