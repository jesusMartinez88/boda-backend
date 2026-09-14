import db from "../db.js";

/**
 * Columnas explícitas del cuestionario. Mantener aquí centralizado para
 * evitar repetir el SELECT * y exponer columnas internas que no queremos
 * devolver al cliente.
 */
const PUBLIC_COLUMNS =
  "id, userId, weddingDate, estimatedGuests, predominantColor, " +
  "hasCountdown, hasBusService, hasHotelService, additionalServices, notes, " +
  "createdAt, updatedAt";

/**
 * Normaliza un payload "crudo" del cuestionario a algo seguro para
 * persistir. Devuelve un objeto solo con las claves válidas y los tipos
 * esperados (0/1 para booleanos, string/numero para el resto).
 *
 * Campos opcionales admitidos: cualquier subconjunto de los de la tabla.
 * Campos no listados se ignoran para evitar mass-assignment (igual que
 * en `models/user.js`).
 */
const BOOLEAN_FIELDS = new Set(["hasCountdown", "hasBusService", "hasHotelService"]);

const sanitizeQuestionnaire = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      ![
        "weddingDate",
        "estimatedGuests",
        "predominantColor",
        "hasCountdown",
        "hasBusService",
        "hasHotelService",
        "additionalServices",
        "notes",
      ].includes(key)
    ) {
      continue;
    }
    if (BOOLEAN_FIELDS.has(key)) {
      // Aceptamos true/false, "true"/"false", 1/0, "1"/"0"
      out[key] =
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1" ||
        value === "yes"
          ? 1
          : 0;
    } else if (value === null || value === "") {
      // Permite "limpiar" campos enviando null/string vacío.
      out[key] = null;
    } else if (key === "estimatedGuests") {
      const n = parseInt(value, 10);
      out[key] = Number.isNaN(n) ? null : n;
    } else {
      out[key] = String(value).trim() || null;
    }
  }
  return out;
};

/**
 * Devuelve el cuestionario del usuario. Si nunca ha rellenado el
 * cuestionario devuelve `null` (el cliente decide si lo trata como
 * "no contestado" o como "formulario en blanco").
 */
export const findByUserId = async (userId) => {
  const row = await db.get(
    `SELECT ${PUBLIC_COLUMNS} FROM landing_questionnaire WHERE userId = ?`,
    [userId],
  );
  return row || null;
};

/**
 * Inserta o actualiza el cuestionario de un usuario (upsert por userId).
 * Devuelve la fila final normalizada.
 */
export const upsert = async (userId, raw) => {
  const data = sanitizeQuestionnaire(raw);
  const existing = await findByUserId(userId);

  if (!existing) {
    const columns = Object.keys(data);
    if (columns.length === 0) {
      // Nada que guardar: insertamos solo userId para reservar la fila.
      await db.run(
        `INSERT OR IGNORE INTO landing_questionnaire (userId) VALUES (?)`,
        [userId],
      );
    } else {
      const placeholders = columns.map(() => "?").join(", ");
      await db.run(
        `INSERT INTO landing_questionnaire (userId, ${columns.join(", ")})
         VALUES (?, ${placeholders})`,
        [userId, ...columns.map((k) => data[k])],
      );
    }
  } else {
    const columns = Object.keys(data);
    if (columns.length > 0) {
      const setClause = columns.map((k) => `${k} = ?`).join(", ");
      await db.run(
        `UPDATE landing_questionnaire
         SET ${setClause}, updatedAt = CURRENT_TIMESTAMP
         WHERE userId = ?`,
        [...columns.map((k) => data[k]), userId],
      );
    }
  }

  return await findByUserId(userId);
};