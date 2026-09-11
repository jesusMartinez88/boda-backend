import db from "../db.js";
import bcrypt from "bcryptjs";

// Columnas "seguras" que devolvemos al frontend (nunca password, etc.)
const PUBLIC_USER_COLUMNS =
  "id, username, email, role, slug, plan, paidAt, invitationCompletedAt, lastLoginAt, createdAt, notes";

export const findByUsername = async (username) => {
  return await db.get("SELECT * FROM users WHERE username = ?", [username]);
};

export const findById = async (id) => {
  return await db.get(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [id]);
};

export const findBySlug = async (slug) => {
  return await db.get(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE slug = ?`, [slug]);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createUser = async ({ username, email, password, role = "user", slug }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.run(
    "INSERT INTO users (username, email, password, role, slug) VALUES (?, ?, ?, ?, ?)",
    [username, email || null, hashedPassword, role, slug],
  );
  return { id: result.lastID, username, email, role, slug };
};

export const updatePassword = async (id, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, id]);
};

export const listUsers = async () => {
  return await db.all(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY createdAt ASC`,
  );
};

export const deleteUser = async (id) => {
  const result = await db.run("DELETE FROM users WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};

export const updateRole = async (id, role) => {
  await db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
};

export const updateLastLogin = async (id) => {
  await db.run(
    "UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );
};

/**
 * Actualiza campos editables de un usuario. Solo permite los campos
 * explícitamente listados en `ALLOWED_FIELDS`; cualquier otra clave del
 * payload se ignora silenciosamente para evitar mass-assignment.
 */
const ALLOWED_FIELDS = new Set([
  "email",
  "plan",
  "paidAt",
  "invitationCompletedAt",
  "role",
  "notes",
]);

export const updateUser = async (id, fields) => {
  const entries = Object.entries(fields || {}).filter(
    ([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined,
  );
  if (entries.length === 0) {
    return await findById(id);
  }

  const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => {
    if (value === null || value === "") {
      return null;
    }
    return value;
  });

  await db.run(
    `UPDATE users SET ${setClause} WHERE id = ?`,
    [...values, id],
  );
  return await findById(id);
};
