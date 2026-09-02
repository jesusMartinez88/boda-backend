import * as Category from "../models/category.js";

export const getCategories = async (req, res) => {
  try {
    const userId = req.userContext.userId;
    const categories = await Category.getCategories(userId);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ success: false, message: "Error al obtener categorías" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userContext.userId;
    if (!name) {
      return res.status(400).json({ success: false, message: "El nombre es obligatorio" });
    }
    
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    
    const newCategory = await Category.createCategory({ userId, name, slug });
    res.json({ success: true, data: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Error al crear la categoría" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userContext.userId;
    
    // Ownership validation - verificar que la categoría existe para este usuario
    const categories = await Category.getCategories(userId);
    const existing = categories.find(c => c.id === parseInt(id));
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Categoría no encontrada" 
      });
    }
    
    if (existing.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }
    
    await Category.deleteCategory(id, userId);
    res.json({ success: true, message: "Categoría eliminada" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Error al eliminar la categoría" });
  }
};
