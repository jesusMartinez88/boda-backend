import * as Table from "../models/table.js";
import * as Guest from "../models/guest.js";
import * as Setting from "../models/setting.js";

const mapTableResponse = (table) => {
  if (!table) return null;
  // Ya no necesitamos mapear 'number' a 'name' porque 'name' ya viene de la BD
  return table;
};

export const getTables = async (req, res) => {
  try {
    const allTables = await Table.getAllTables();
    
    res.json({
      success: true,
      data: allTables.map(mapTableResponse),
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching tables",
      message: error.message,
    });
  }
};

export const getTable = async (req, res) => {
  try {
    const { id } = req.params;
    const table = await Table.getTableById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        error: "Table not found",
      });
    }
    res.json({
      success: true,
      data: mapTableResponse(table),
    });
  } catch (error) {
    console.error("Error fetching table:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching table",
      message: error.message,
    });
  }
};

export const createTable = async (req, res) => {
  try {
    const { name, capacity, shape } = req.body;
    
    // Si no se proporciona nombre, generamos uno correlativo "Mesa X"
    let tableName = name;
    if (!tableName) {
      tableName = await Table.getNextTableName();
    }
    
    const tableToCreate = {
      name: tableName,
      capacity: capacity || 10,
      shape: shape || 'round'
    };

    const result = await Table.createTable(tableToCreate);
    res.status(201).json({
      success: true,
      data: mapTableResponse(result),
      message: `Table created as ${tableName}`
    });
  } catch (error) {
    console.error("Error creating table:", error);
    
    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        success: false,
        error: "Duplicate table name",
        message: "A table with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error creating table",
      message: error.message,
    });
  }
};

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, shape } = req.body;

    const result = await Table.updateTableById(id, { name, capacity, shape });
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Table not found",
      });
    }

    res.json({
      success: true,
      data: mapTableResponse({ id, name, capacity, shape }), // Nota: esto es parcial pero cumple la respuesta
    });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({
      success: false,
      error: "Error updating table",
      message: error.message,
    });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener la mesa para saber su nombre (y poder desasignar invitados)
    const table = await Table.getTableById(id);
    if (!table) {
      // Intentar borrar por nombre si el ID parece un nombre (compatibilidad parcial)
      const nameToDelete = id; 
      const unassignResult = await Guest.unassignGuestsFromTable(nameToDelete);
      const configResult = await Table.deleteTableByName(nameToDelete);
      
      if (configResult.changes === 0 && unassignResult.changes === 0) {
        return res.status(404).json({
          success: false,
          error: "Table not found",
        });
      }
      
      return res.json({
        success: true,
        message: `Table ${nameToDelete} removed.`
      });
    }

    const tableName = table.name;
    
    // 2. Desasignar a los invitados de esta mesa
    const unassignResult = await Guest.unassignGuestsFromTable(tableName);
    
    // 3. Borrar la configuración de la mesa por ID
    const configResult = await Table.deleteTableById(id);
    
    res.json({
      success: true,
      data: {
        id: parseInt(id, 10),
        name: tableName,
        unassignedGuests: unassignResult.changes,
        configDeleted: configResult.changes > 0
      },
      message: `Table "${tableName}" (ID ${id}) deleted.`
    });
  } catch (error) {
    console.error("[TableController] Error deleting table:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting table",
      message: error.message,
    });
  }
};
