import db from "../db.js";

export const getNextTableName = async (userId) => {
  // Buscar el valor numérico más alto en nombres que sigan el patrón "Mesa X"
  const rows = await db.all(
    `SELECT name FROM tables WHERE userId = ? AND name LIKE 'Mesa %'`,
    [userId],
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

export const getAllTables = async (userId) => {
  const rows = await db.all("SELECT * FROM tables WHERE userId = ? ORDER BY name ASC", [userId]);
  if (rows && rows.length > 0) {
    rows.forEach((row) => {
      if (row.captainIds && typeof row.captainIds === "string") {
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

export const getTableByName = async (name, userId) => {
  return await db.get("SELECT * FROM tables WHERE name = ? AND userId = ?", [name, userId]);
};

export const getTableById = async (id, userId) => {
  const row = userId !== undefined
    ? await db.get("SELECT * FROM tables WHERE id = ? AND userId = ?", [id, userId])
    : await db.get("SELECT * FROM tables WHERE id = ?", [id]);

  if (row && row.captainIds && typeof row.captainIds === "string") {
    try {
      row.captainIds = JSON.parse(row.captainIds);
    } catch (e) {
      row.captainIds = null;
    }
  }
  return row;
};

export const createTable = async (tableData) => {
  const {
    userId,
    name,
    capacity,
    shape,
    posX,
    posY,
    captainIds,
    rotation,
    highchairs,
  } = tableData;
  let captainIdsJson = null;
  if (captainIds && Array.isArray(captainIds)) {
    captainIdsJson = JSON.stringify(captainIds);
  }
  const result = await db.run(
    "INSERT INTO tables (userId, name, capacity, shape, posX, posY, captainIds, rotation, highchairs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      userId || null,
      name,
      capacity,
      shape || "round",
      posX || 0,
      posY || 0,
      captainIdsJson,
      rotation ?? 0,
      highchairs ?? 0,
    ],
  );
  return { id: result.lastID, ...tableData };
};

// Quita un captainId de TODAS las mesas excepto la mesa excludedId (del mismo usuario)
export const removeCaptainFromAllOtherTables = async (
  captainId,
  excludedTableId,
  userId,
) => {
  const whereClause = userId !== undefined
    ? "WHERE id != ? AND userId = ?"
    : "WHERE id != ?";
  const params = userId !== undefined ? [excludedTableId, userId] : [excludedTableId];
  const tables = await db.all(
    `SELECT id, captainIds FROM tables ${whereClause}`,
    params,
  );

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

export const updateTableById = async (id, tableData, userId) => {
  const {
    name,
    capacity,
    shape,
    posX,
    posY,
    captainIds,
    rotation,
    highchairs,
  } = tableData;
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
  if (highchairs !== undefined) {
    fields.push("highchairs = ?");
    params.push(highchairs);
  }

  if ("captainIds" in tableData) {
    const oldTable = await db.get(
      "SELECT captainIds FROM tables WHERE id = ?",
      [id],
    );
    let oldCaptainIds = [];
    if (oldTable && oldTable.captainIds) {
      try {
        oldCaptainIds = JSON.parse(oldTable.captainIds);
      } catch (e) {}
    }

    let captainIdsJson = null;
    if (Array.isArray(captainIds)) {
      captainIdsJson =
        captainIds.length > 0 ? JSON.stringify(captainIds) : null;

      for (const cid of oldCaptainIds) {
        await removeCaptainFromAllOtherTables(cid, id, userId);
      }
      for (const cid of captainIds) {
        await removeCaptainFromAllOtherTables(cid, id, userId);
      }
    }

    fields.push("captainIds = ?");
    params.push(captainIdsJson);
  }

  if (fields.length === 0) {
    return { id, changes: 0, skipped: true };
  }

  if (userId !== undefined) {
    params.push(id, userId);
    const result = await db.run(
      `UPDATE tables SET ${fields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
      params,
    );
    return { id, changes: result.changes };
  } else {
    params.push(id);
    const result = await db.run(
      `UPDATE tables SET ${fields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
    );
    return { id, changes: result.changes };
  }
};

export const deleteTableById = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  const result = await db.run(`DELETE FROM tables ${whereClause}`, params);
  return { id, changes: result.changes };
};

export const deleteTableByName = async (name, userId) => {
  const whereClause = userId !== undefined ? "WHERE name = ? AND userId = ?" : "WHERE name = ?";
  const params = userId !== undefined ? [name, userId] : [name];
  const result = await db.run(`DELETE FROM tables ${whereClause}`, params);
  return { name, changes: result.changes };
};

export const deleteAllTables = async (userId) => {
  if (userId !== undefined) {
    await db.run("DELETE FROM tables WHERE userId = ?", [userId]);
  } else {
    await db.run("DELETE FROM tables");
  }
  return { deletedAll: true };
};
