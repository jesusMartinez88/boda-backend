import db from "../db.js";

export const getSetting = (key) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
};

export const updateSetting = (key, value) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE settings SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?",
      [value, key],
      function (err) {
        if (err) reject(err);
        else resolve({ key, value, changes: this.changes });
      }
    );
  });
};

export const getAllSettings = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};
