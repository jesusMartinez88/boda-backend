import db from "../db.js";

export const getAllFinances = async (userId) => {
  const rows = await db.all(
    "SELECT * FROM finances WHERE userId = ? ORDER BY date DESC",
    [userId],
  );
  return rows || [];
};

export const getFinanceById = async (id, userId) => {
  return await db.get("SELECT * FROM finances WHERE id = ?", [id]);
};

export const checkFinanceExists = async (id) => {
  return await db.get("SELECT id, userId FROM finances WHERE id = ?", [id]);
};

export const createFinance = async (financeData) => {
  const { userId, description, amount, type, category, date, paidBy } = financeData;
  const result = await db.run(
    `INSERT INTO finances (userId, description, amount, type, category, date, paidBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId ?? null,
      description,
      amount,
      type,
      category ?? null,
      date || new Date().toISOString(),
      paidBy ?? null,
    ],
  );
  return { id: result.lastID, ...financeData };
};

export const updateFinance = async (id, financeData, userId) => {
  const { description, amount, type, category, date, paidBy } = financeData;
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [description, amount, type, category, date, paidBy, id, userId] : [description, amount, type, category, date, paidBy, id];
  await db.run(
    `UPDATE finances SET description = ?, amount = ?, type = ?, category = ?, date = ?, paidBy = ?, updatedAt = CURRENT_TIMESTAMP ${whereClause}`,
    params,
  );
  return { id, ...financeData };
};

export const deleteFinance = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  const result = await db.run(`DELETE FROM finances ${whereClause}`, params);
  return { deletedId: id, changes: result.changes };
};
