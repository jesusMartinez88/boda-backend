import db from "../db.js";

export const getAllFinances = async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM finances ORDER BY date DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const getFinanceById = async (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM finances WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const createFinance = async (financeData) => {
  const { description, amount, type, category, date } = financeData;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO finances (description, amount, type, category, date) VALUES (?, ?, ?, ?, ?)`,
      [description, amount, type, category, date || new Date().toISOString()],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...financeData });
      }
    );
  });
};

export const updateFinance = async (id, financeData) => {
  const { description, amount, type, category, date } = financeData;
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE finances SET description = ?, amount = ?, type = ?, category = ?, date = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [description, amount, type, category, date, id],
      function (err) {
        if (err) reject(err);
        else resolve({ id, ...financeData });
      }
    );
  });
};

export const deleteFinance = async (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM finances WHERE id = ?", [id], function (err) {
      if (err) reject(err);
      else resolve({ deletedId: id, changes: this.changes });
    });
  });
};
