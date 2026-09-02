import db from "../db.js";

export const getAllGuests = async (filters = {}, userId) => {
  let query = "SELECT * FROM guests WHERE userId = ?";
  const params = [userId];

  if (filters.attending !== undefined) {
    query += " AND attending = ?";
    params.push(filters.attending ? 1 : 0);
  }

  if (filters.needsTransport !== undefined) {
    query += " AND needsTransport = ?";
    params.push(filters.needsTransport ? 1 : 0);
  }

  if (filters.search) {
    query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += " ORDER BY name ASC";

  const rows = await db.all(query, params);
  return rows || [];
};

export const getGuestById = async (id, userId) => {
  if (userId !== undefined) {
    return await db.get("SELECT * FROM guests WHERE id = ? AND userId = ?", [id, userId]);
  }
  return await db.get("SELECT * FROM guests WHERE id = ?", [id]);
};

export const createGuest = async (guestData) => {
  const {
    userId,
    name,
    email,
    phone,
    attending,
    mealType,
    needsTransport,
    allergies,
    notes,
    tableId,
    isAdult,
    seatNumber,
  } = guestData;

  const result = await db.run(
    `INSERT INTO guests (userId, name, email, phone, attending, mealType, needsTransport, allergies, notes, tableId, isAdult, seatNumber)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      name,
      email || null,
      phone || null,
      attending ? 1 : 0,
      mealType || "normal",
      needsTransport ? 1 : 0,
      allergies || null,
      notes || null,
      tableId || null,
      isAdult !== undefined ? (isAdult ? 1 : 0) : 1,
      seatNumber !== undefined && seatNumber !== null ? seatNumber : null,
    ],
  );

  return { id: result.lastID, ...guestData };
};

export const updateGuest = async (id, guestData, userId) => {
  const {
    name,
    email,
    phone,
    attending,
    mealType,
    needsTransport,
    allergies,
    notes,
    tableId,
    isAdult,
    seatNumber,
  } = guestData;

  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const whereParams = userId !== undefined ? [id, userId] : [id];

  await db.run(
    `UPDATE guests SET name = ?, email = ?, phone = ?, attending = ?, mealType = ?, needsTransport = ?, allergies = ?, notes = ?, tableId = ?, isAdult = ?, seatNumber = ?, updatedAt = CURRENT_TIMESTAMP
     ${whereClause}`,
    [
      name,
      email || null,
      phone || null,
      attending ? 1 : 0,
      mealType || "normal",
      needsTransport ? 1 : 0,
      allergies || null,
      notes || null,
      tableId !== undefined ? tableId : null,
      isAdult !== undefined ? (isAdult ? 1 : 0) : 1,
      seatNumber !== undefined && seatNumber !== null ? seatNumber : null,
      ...whereParams,
    ],
  );

  return { id, ...guestData };
};

export const patchGuest = async (id, partialData, userId) => {
  const allowedFields = [
    "name",
    "email",
    "phone",
    "attending",
    "mealType",
    "needsTransport",
    "allergies",
    "notes",
    "tableId",
    "isAdult",
    "seatNumber",
  ];

  const fields = Object.keys(partialData).filter((field) =>
    allowedFields.includes(field),
  );
  if (fields.length === 0) return await getGuestById(id, userId);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = fields.map((field) => {
    const value = partialData[field];
    if (
      field === "attending" ||
      field === "needsTransport" ||
      field === "isAdult"
    ) {
      return value ? 1 : 0;
    }
    return value;
  });

  if (userId !== undefined) {
    params.push(id, userId);
    await db.run(
      `UPDATE guests SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
      params,
    );
  } else {
    params.push(id);
    await db.run(
      `UPDATE guests SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
    );
  }

  return await getGuestById(id, userId);
};

export const deleteGuest = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  const result = await db.run(`DELETE FROM guests ${whereClause}`, params);
  return { deletedId: id, changes: result.changes };
};

export const deleteAllGuests = async (userId) => {
  if (userId !== undefined) {
    await db.run("DELETE FROM guests WHERE userId = ?", [userId]);
  } else {
    await db.run("DELETE FROM guests");
  }
  return { deletedAll: true };
};

export const getGuestStats = async (userId) => {
  return await db.get(
    `SELECT 
      COUNT(*) as totalGuests,
      SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END) as confirmados,
      SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport,
      SUM(CASE WHEN isAdult = 1 THEN 1 ELSE 0 END) as totalAdults,
      SUM(CASE WHEN isAdult = 0 THEN 1 ELSE 0 END) as totalChildren
     FROM guests WHERE userId = ?`,
    [userId],
  );
};

export const getAttendanceStats = async (userId) => {
  const rows = await db.all(
    `SELECT attending, COUNT(*) as count FROM guests WHERE userId = ? GROUP BY attending`,
    [userId],
  );

  const stats = {
    confirmed: 0,
    pending: 0,
  };
  rows?.forEach((row) => {
    if (Number(row.attending) === 1) stats.confirmed = Number(row.count);
    if (Number(row.attending) === 0) stats.pending = Number(row.count);
  });
  return stats;
};

export const getTransportationStats = async (userId) => {
  return await db.get(
    `SELECT 
      SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport,
      SUM(CASE WHEN needsTransport = 0 THEN 1 ELSE 0 END) as noTransport
     FROM guests WHERE userId = ?`,
    [userId],
  );
};

export const getAllergiesStats = async (userId) => {
  return await db.all(
    `SELECT allergies, COUNT(*) as count FROM guests WHERE userId = ? AND allergies IS NOT NULL AND allergies != '' GROUP BY allergies`,
    [userId],
  );
};

export const getUniqueTableIds = async (userId) => {
  const rows = await db.all(
    "SELECT DISTINCT tableId FROM guests WHERE userId = ? AND tableId IS NOT NULL",
    [userId],
  );
  return rows.map((r) => r.tableId);
};

export const unassignGuestsFromTable = async (tableId, userId) => {
  const whereClause = userId !== undefined
    ? "WHERE tableId = ? AND userId = ?"
    : "WHERE tableId = ?";
  const params = userId !== undefined ? [tableId, userId] : [tableId];
  const result = await db.run(
    `UPDATE guests SET tableId = NULL, seatNumber = NULL, updatedAt = CURRENT_TIMESTAMP ${whereClause}`,
    params,
  );
  return { tableId, changes: result.changes };
};

export const unassignAllGuestsFromTables = async (userId) => {
  const whereClause = userId !== undefined
    ? "WHERE tableId IS NOT NULL AND userId = ?"
    : "WHERE tableId IS NOT NULL";
  const params = userId !== undefined ? [userId] : [];
  const result = await db.run(
    `UPDATE guests SET tableId = NULL, seatNumber = NULL, updatedAt = CURRENT_TIMESTAMP ${whereClause}`,
    params,
  );
  return { changes: result.changes };
};

// Quita un guestId concreto del captainIds de una mesa específica
export const removeCaptainFromTable = async (tableId, guestId) => {
  const table = await db.get("SELECT id, captainIds FROM tables WHERE id = ?", [tableId]);
  if (!table || !table.captainIds) return;

  let captainIds = table.captainIds;
  if (typeof captainIds === "string") {
    try {
      captainIds = JSON.parse(captainIds);
    } catch (e) {
      return;
    }
  }

  if (!Array.isArray(captainIds)) return;

  const idx = captainIds.indexOf(Number(guestId));
  if (idx === -1) return;

  captainIds.splice(idx, 1);
  const newJson = captainIds.length > 0 ? JSON.stringify(captainIds) : null;
  await db.run(
    "UPDATE tables SET captainIds = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
    [newJson, tableId],
  );
};
