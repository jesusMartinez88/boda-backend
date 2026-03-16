import * as Table from "../models/table.js";
import * as Guest from "../models/guest.js";
import * as Setting from "../models/setting.js";
import { sendDeleteCodeEmail } from "../services/emailService.js";

const mapTableResponse = (table) => {
  if (!table) return null;
  // Ya no necesitamos mapear 'number' a 'name' porque 'name' ya viene de la BD
  return table;
};

// sistema simple de código de confirmación para borrado masivo de mesas
let pendingDeleteCode = null;
let pendingDeleteExpiry = null;

const generateDeleteCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
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
    const { name, capacity, shape, posX, posY } = req.body;

    // Si no se proporciona nombre, generamos uno correlativo "Mesa X"
    let tableName = name;
    if (!tableName) {
      tableName = await Table.getNextTableName();
    }

    const tableToCreate = {
      name: tableName,
      capacity: capacity || 10,
      shape: shape || "round",
      posX: posX || 0,
      posY: posY || 0,
    };

    const result = await Table.createTable(tableToCreate);
    res.status(201).json({
      success: true,
      data: mapTableResponse(result),
      message: `Table created as ${tableName}`,
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
    const { name, capacity, shape, posX, posY } = req.body;

    const result = await Table.updateTableById(id, {
      name,
      capacity,
      shape,
      posX,
      posY,
    });
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Table not found",
      });
    }

    res.json({
      success: true,
      data: mapTableResponse({ id, name, capacity, shape, posX, posY }), // Nota: esto es parcial pero cumple la respuesta
    });
  } catch (error) {
    console.error("Error updating table:", error);

    if (error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        success: false,
        error: "Duplicate table name",
        message: "A table with this name already exists.",
      });
    }

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

    // 1. Obtener la mesa para verificar que existe
    const table = await Table.getTableById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        error: "Table not found",
      });
    }

    const tableName = table.name;

    // 2. Desasignar a los invitados de esta mesa (usando el ID de la mesa)
    const unassignResult = await Guest.unassignGuestsFromTable(id);

    // 3. Borrar la configuración de la mesa por ID
    const configResult = await Table.deleteTableById(id);

    res.json({
      success: true,
      data: {
        id: parseInt(id, 10),
        name: tableName,
        unassignedGuests: unassignResult.changes,
        configDeleted: configResult.changes > 0,
      },
      message: `Table "${tableName}" (ID ${id}) deleted and ${unassignResult.changes} guest(s) unassigned.`,
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

// solicita envío de código de confirmación para borrado de todas las mesas
export const requestDeleteCode = async (req, res) => {
  try {
    // generar y guardar código con expiración (15 minutos)
    pendingDeleteCode = generateDeleteCode();
    pendingDeleteExpiry = Date.now() + 15 * 60 * 1000;

    // log para desarrollo
    console.log("🔐 Código de borrado de mesas generado:", pendingDeleteCode);

    // enviar correo al dueño
    await sendDeleteCodeEmail(pendingDeleteCode);

    // en desarrollo devolvemos el código tambien para facilitar pruebas
    const responsePayload = {
      success: true,
      message: "Confirmation code sent via email",
    };
    if (process.env.NODE_ENV !== "production") {
      responsePayload.code = pendingDeleteCode;
    }
    res.json(responsePayload);
  } catch (error) {
    console.error("Error requesting delete code:", error);
    res.status(500).json({
      success: false,
      error: "Error generating confirmation code",
      message: error.message,
    });
  }
};

// controlador para borrar todas las mesas
export const deleteAllTables = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Confirmation code missing",
      });
    }
    if (code !== pendingDeleteCode) {
      return res.status(400).json({
        success: false,
        error: "Invalid confirmation code",
      });
    }
    if (Date.now() > pendingDeleteExpiry) {
      pendingDeleteCode = null;
      pendingDeleteExpiry = null;
      return res.status(400).json({
        success: false,
        error: "Confirmation code expired",
      });
    }

    // resetear código para evitar reutilización
    pendingDeleteCode = null;
    pendingDeleteExpiry = null;

    // antes de borrar las mesas, desasignar todos los invitados
    await Guest.unassignAllGuestsFromTables();

    const result = await Table.deleteAllTables();
    res.json({
      success: true,
      data: result,
      message: "All tables deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting all tables:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting all tables",
      message: error.message,
    });
  }
};
