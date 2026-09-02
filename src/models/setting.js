import db from "../db.js";

export const getSetting = async (key) => {
  const row = await db.get("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : null;
};

export const updateSetting = async (key, value) => {
  const updateResult = await db.run(
    "UPDATE settings SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?",
    [value, key],
  );

  if (updateResult.changes > 0) {
    return { key, value, changes: updateResult.changes };
  }

  const insertResult = await db.run(
    "INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)",
    [key, value],
  );

  return { key, value, changes: insertResult.changes };
};

export const getAllSettings = async () => {
  const rows = await db.all("SELECT * FROM settings");
  return rows || [];
};
