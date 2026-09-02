import db from "../db.js";
import bcrypt from "bcryptjs";

export const findByUsername = async (username) => {
  return await db.get("SELECT * FROM users WHERE username = ?", [username]);
};

export const findById = async (id) => {
  return await db.get("SELECT id, username, email, role, slug, createdAt FROM users WHERE id = ?", [id]);
};

export const findBySlug = async (slug) => {
  return await db.get("SELECT id, username, email, role, slug, createdAt FROM users WHERE slug = ?", [slug]);
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
    "SELECT id, username, email, role, slug, createdAt FROM users ORDER BY createdAt ASC",
  );
};

export const deleteUser = async (id) => {
  const result = await db.run("DELETE FROM users WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};

export const updateRole = async (id, role) => {
  await db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
};
