import db from "../db.js";

export const getCategories = async () => {
  return await db.all("SELECT * FROM contact_categories ORDER BY createdAt ASC");
};

export const createCategory = async (category) => {
  const { name, slug } = category;
  const result = await db.run(
    "INSERT INTO contact_categories (name, slug) VALUES (?, ?)",
    [name, slug]
  );
  
  return await db.get("SELECT * FROM contact_categories WHERE id = ?", [result.lastID]);
};

export const deleteCategory = async (id) => {
  return await db.run("DELETE FROM contact_categories WHERE id = ?", [id]);
};
