import db from "../db.js";

export const getAllGuests = async (filters = {}) => {
  let query = "SELECT * FROM guests WHERE 1=1";
  const params = [];

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

export const getGuestById = async (id) => {
  return await db.get("SELECT * FROM guests WHERE id = ?", [id]);
};

export const createGuest = async (guestData) => {
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

  const result = await db.run(
    `INSERT INTO guests (name, email, phone, attending, mealType, needsTransport, allergies, notes, tableId, isAdult, seatNumber)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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

export const updateGuest = async (id, guestData) => {
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

  await db.run(
    `UPDATE guests SET name = ?, email = ?, phone = ?, attending = ?, mealType = ?, needsTransport = ?, allergies = ?, notes = ?, tableId = ?, isAdult = ?, seatNumber = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
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
      id,
    ],
  );

  return { id, ...guestData };
};

export const patchGuest = async (id, partialData) => {
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
  if (fields.length === 0) return await getGuestById(id);

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
  params.push(id);

  await db.run(
    `UPDATE guests SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    params,
  );

  return await getGuestById(id);
};

export const deleteGuest = async (id) => {
  const result = await db.run("DELETE FROM guests WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};

export const deleteAllGuests = async () => {
  await db.run("DELETE FROM guests");
  await db.run("DELETE FROM sqlite_sequence WHERE name = 'guests'");
  return { deletedAll: true, resetSeq: true };
};

export const getGuestStats = async () => {
  return await db.get(
    `SELECT 
      COUNT(*) as totalGuests,
      SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END) as confirmados,
      SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END) as pendientes,
      SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport,
      SUM(CASE WHEN isAdult = 1 THEN 1 ELSE 0 END) as totalAdults,
      SUM(CASE WHEN isAdult = 0 THEN 1 ELSE 0 END) as totalChildren
     FROM guests`,
  );
};

export const getAttendanceStats = async () => {
  const rows = await db.all(
    `SELECT attending, COUNT(*) as count FROM guests GROUP BY attending`,
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

export const getTransportationStats = async () => {
  return await db.get(
    `SELECT 
      SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport,
      SUM(CASE WHEN needsTransport = 0 THEN 1 ELSE 0 END) as noTransport
     FROM guests`,
  );
};

export const getAllergiesStats = async () => {
  return await db.all(
    `SELECT allergies, COUNT(*) as count FROM guests WHERE allergies IS NOT NULL AND allergies != '' GROUP BY allergies`,
  );
};

export const getUniqueTableIds = async () => {
  const rows = await db.all(
    "SELECT DISTINCT tableId FROM guests WHERE tableId IS NOT NULL",
  );
  return rows.map((r) => r.tableId);
};

export const unassignGuestsFromTable = async (tableId) => {
  const result = await db.run(
    "UPDATE guests SET tableId = NULL, seatNumber = NULL, updatedAt = CURRENT_TIMESTAMP WHERE tableId = ?",
    [tableId],
  );
  return { tableId, changes: result.changes };
};

export const unassignAllGuestsFromTables = async () => {
  const result = await db.run(
    "UPDATE guests SET tableId = NULL, seatNumber = NULL, updatedAt = CURRENT_TIMESTAMP WHERE tableId IS NOT NULL",
  );
  return { changes: result.changes };
};
