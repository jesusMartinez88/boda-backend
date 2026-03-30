import db from "../db.js";

export const getAllFinances = async () => {
  const rows = await db.all("SELECT * FROM finances ORDER BY date DESC");
  return rows || [];
};

export const getFinanceById = async (id) => {
  return await db.get("SELECT * FROM finances WHERE id = ?", [id]);
};

export const createFinance = async (financeData) => {
  const { description, amount, type, category, date, paidBy } = financeData;
  const result = await db.run(
    `INSERT INTO finances (description, amount, type, category, date, paidBy) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      description,
      amount,
      type,
      category,
      date || new Date().toISOString(),
      paidBy,
    ],
  );
  return { id: result.lastID, ...financeData };
};

export const updateFinance = async (id, financeData) => {
  const { description, amount, type, category, date, paidBy } = financeData;
  await db.run(
    `UPDATE finances SET description = ?, amount = ?, type = ?, category = ?, date = ?, paidBy = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [description, amount, type, category, date, paidBy, id],
  );
  return { id, ...financeData };
};

export const deleteFinance = async (id) => {
  const result = await db.run("DELETE FROM finances WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};
