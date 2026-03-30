import db from "../db.js";

export const getSetting = async (key) => {
  const row = await db.get("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : null;
};

export const updateSetting = async (key, value) => {
  const result = await db.run(
    "UPDATE settings SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?",
    [value, key],
  );
  return { key, value, changes: result.changes };
};

export const getAllSettings = async () => {
  const rows = await db.all("SELECT * FROM settings");
  return rows || [];
};
