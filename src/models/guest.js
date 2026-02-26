import db from "../db.js";
import { promisify } from "util";

// Promisificar métodos de la base de datos
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

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

  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

export const getGuestById = async (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM guests WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
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
  } = guestData;

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO guests (name, email, phone, attending, mealType, needsTransport, allergies, notes, tableId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone,
        attending ? 1 : 0,
        mealType || "normal",
        needsTransport ? 1 : 0,
        allergies,
        notes,
        tableId || null,
      ],
      function (err) {
        if (err) reject(err);
        else {
          resolve({ id: this.lastID, ...guestData });
        }
      },
    );
  });
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
  } = guestData;

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE guests SET name = ?, email = ?, phone = ?, attending = ?, mealType = ?, needsTransport = ?, allergies = ?, notes = ?, tableId = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        email,
        phone,
        attending ? 1 : 0,
        mealType || "normal",
        needsTransport ? 1 : 0,
        allergies,
        notes,
        tableId !== undefined ? tableId : null,
        id,
      ],
      function (err) {
        if (err) reject(err);
        else {
          resolve({ id, ...guestData });
        }
      },
    );
  });
};

export const patchGuest = async (id, partialData) => {
  // Whitelist de campos permitidos para actualización parcial
  const allowedFields = [
    "name", "email", "phone", "attending", "mealType", 
    "needsTransport", "allergies", "notes", "tableId"
  ];

  const fields = Object.keys(partialData).filter(field => allowedFields.includes(field));
  if (fields.length === 0) return await getGuestById(id);

  const setClause = fields
    .map((field) => `${field} = ?`)
    .join(", ");
  const params = fields.map((field) => {
    const value = partialData[field];
    if (field === "attending" || field === "needsTransport") {
      return value ? 1 : 0;
    }
    return value;
  });
  params.push(id);

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE guests SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
      async function (err) {
        if (err) reject(err);
        else {
          const updated = await getGuestById(id);
          resolve(updated);
        }
      }
    );
  });
};

export const deleteGuest = async (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM guests WHERE id = ?", [id], function (err) {
      if (err) reject(err);
      else {
        resolve({ deletedId: id, changes: this.changes });
      }
    });
  });
};

export const getGuestStats = async () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        COUNT(*) as totalGuests,
        SUM(CASE WHEN attending = 1 THEN 1 ELSE 0 END) as confirmados,
        SUM(CASE WHEN attending = 0 THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport
       FROM guests`,
      [],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      },
    );
  });
};

export const getAttendanceStats = async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT attending, COUNT(*) as count FROM guests GROUP BY attending`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else {
          const stats = {
            confirmed: 0,
            pending: 0,
          };
          rows?.forEach((row) => {
            if (row.attending === 1) stats.confirmed = row.count;
            if (row.attending === 0) stats.pending = row.count;
          });
          resolve(stats);
        }
      },
    );
  });
};

export const getTransportationStats = async () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        SUM(CASE WHEN needsTransport = 1 THEN 1 ELSE 0 END) as needTransport,
        SUM(CASE WHEN needsTransport = 0 THEN 1 ELSE 0 END) as noTransport
       FROM guests`,
      [],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      },
    );
  });
};

export const getAllergiesStats = async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT allergies, COUNT(*) as count FROM guests WHERE allergies IS NOT NULL AND allergies != '' GROUP BY allergies`,
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      },
    );
  });
};

export const getUniqueTableIds = async () => {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT DISTINCT tableId FROM guests WHERE tableId IS NOT NULL",
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.tableId));
      }
    );
  });
};

export const unassignGuestsFromTable = async (tableId) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE guests SET tableId = NULL, updatedAt = CURRENT_TIMESTAMP WHERE tableId = ?",
      [tableId],
      function (err) {
        if (err) reject(err);
        else resolve({ tableId, changes: this.changes });
      }
    );
  });
};
