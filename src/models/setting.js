import db from "../db.js";

export const getSetting = async (key, userId) => {
  const row = await db.get(
    "SELECT value FROM settings WHERE key = ? AND userId = ?",
    [key, userId],
  );
  return row ? row.value : null;
};

export const updateSetting = async (key, value, userId) => {
  const result = await db.run(
    `INSERT INTO settings (userId, key, value, updatedAt)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(userId, key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP`,
    [userId, key, value],
  );

  return { key, value, changes: result.changes };
};

export const getAllSettings = async (userId) => {
  const rows = await db.all("SELECT * FROM settings WHERE userId = ?", [
    userId,
  ]);
  return rows || [];
};
