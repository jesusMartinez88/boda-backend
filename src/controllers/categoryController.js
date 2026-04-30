import * as Category from "../models/category.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ success: false, message: "Error al obtener categorías" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "El nombre es obligatorio" });
    }
    
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const newCategory = await Category.createCategory({ name, slug });
    res.json({ success: true, data: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Error al crear la categoría" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.deleteCategory(id);
    res.json({ success: true, message: "Categoría eliminada" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Error al eliminar la categoría" });
  }
};
