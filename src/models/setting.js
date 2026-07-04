import db from "../db.js";

export const getSetting = async (key) => {
  const row = await db.get("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : null;
};

export const updateSetting = async (key, value) => {
  const result = await db.run(
    `INSERT INTO settings (key, value, updatedAt)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = CURRENT_TIMESTAMP`,
    [key, value],
  );
  return { key, value, changes: result.changes };
};

export const getAllSettings = async () => {
  const rows = await db.all("SELECT * FROM settings");
  return rows || [];
};
