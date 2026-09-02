import db from "../db.js";

export const getCategories = async (userId) => {
  return await db.all(
    "SELECT * FROM contact_categories WHERE userId = ? ORDER BY createdAt ASC",
    [userId],
  );
};

export const createCategory = async (category) => {
  const { userId, name, slug } = category;
  const result = await db.run(
    "INSERT INTO contact_categories (userId, name, slug) VALUES (?, ?, ?)",
    [userId || null, name, slug]
  );

  return await db.get("SELECT * FROM contact_categories WHERE id = ?", [result.lastID]);
};

export const deleteCategory = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  return await db.run(`DELETE FROM contact_categories ${whereClause}`, params);
};
