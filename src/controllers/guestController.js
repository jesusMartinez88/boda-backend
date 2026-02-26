import * as Guest from "../models/guest.js";
import * as Setting from "../models/setting.js";
import db from "../db.js";
import { promisify } from "util";
import {
  sendNewGuestEmail,
  sendGuestConfirmationEmail,
} from "../services/emailService.js";

const dbAll = promisify(db.all.bind(db));

const assignRandomTable = async (neededSpace = 1) => {
  try {
    // 1. Obtener capacidad máxima global por defecto
    const globalMaxStr = await Setting.getSetting("max_guests_per_table");
    const globalMax = parseInt(globalMaxStr || "10", 10);

    // 2. Obtener definiciones de mesas específicas
    const tableDefinitions = await dbAll("SELECT id, name, capacity FROM tables");
    const tableInfo = {};
    tableDefinitions.forEach(t => {
      tableInfo[t.id] = { name: t.name, capacity: t.capacity || globalMax };
    });

    // 3. Obtener ocupación actual de las mesas
    const tableCounts = await dbAll(
      "SELECT tableId, COUNT(*) as count FROM guests WHERE tableId IS NOT NULL GROUP BY tableId"
    );

    // 4. Identificar ocupación
    const currentOccupancy = {};
    tableCounts.forEach(t => {
      currentOccupancy[t.tableId] = t.count;
    });

    const availableTableIds = [];

    Object.keys(tableInfo).forEach(id => {
      const info = tableInfo[id];
      const occupied = currentOccupancy[id] || 0;
      if ((info.capacity - occupied) >= neededSpace) {
        availableTableIds.push(id);
      }
    });

    if (availableTableIds.length > 0) {
      // 5. Seleccionar una mesa aleatoria con espacio
      const randomIndex = Math.floor(Math.random() * availableTableIds.length);
      return parseInt(availableTableIds[randomIndex], 10);
    } else {
      // 6. Si no hay mesas configuradas con espacio, devolver null o crear una si existiera lógica de creación automática
      // Nota: El sistema ahora es ID-based, así que necesitamos que la mesa EXISTA en la tabla 'tables' primero.
      // Si no hay ninguna mesa, devolvemos null por defecto.
      return tableDefinitions.length > 0 ? tableDefinitions[0].id : null;
    }
  } catch (error) {
    console.error("Error in assignRandomTable:", error);
    return null;
  }
};

export const getGuests = async (req, res) => {
  try {
    const { attending, needsTransport, search } = req.query;
    const filters = {};

    if (attending !== undefined) {
      filters.attending = attending === "true";
    }
    if (needsTransport !== undefined) {
      filters.needsTransport = needsTransport === "true";
    }
    if (search) {
      filters.search = search;
    }

    const guests = await Guest.getAllGuests(filters);
    res.json({
      success: true,
      data: guests,
      count: guests.length,
    });
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching guests",
      message: error.message,
    });
  }
};

export const getGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.getGuestById(id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found",
      });
    }

    res.json({
      success: true,
      data: guest,
    });
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching guest",
      message: error.message,
    });
  }
};

export const createGuest = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      attending,
      mealType,
      needsTransport,
      allergies,
      notes,
    } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const totalAttendees = parseInt(attending || "1", 10);
    
    // FEATURE: Asignar mesa de grupo
    const tableId = await assignRandomTable(totalAttendees);

    const createdGuests = [];

    // 1. Crear invitado principal
    const mainGuest = await Guest.createGuest({
      name,
      email,
      phone,
      attending: true,
      mealType: mealType || "normal",
      needsTransport: needsTransport || false,
      allergies,
      notes,
      tableId,
    });
    createdGuests.push(mainGuest);

    // 2. Crear acompañantes (si attending > 1)
    if (totalAttendees > 1) {
      for (let i = 1; i < totalAttendees; i++) {
        const companion = await Guest.createGuest({
          name: `${name} - Acompañante ${i}`,
          email: null,
          phone: null,
          attending: true,
          mealType: "normal", // Por defecto, el front puede editar después
          needsTransport: needsTransport || false,
          allergies: null,
          notes: `Acompañante de ${name}`,
          tableId,
        });
        createdGuests.push(companion);
      }
    }

    // Enviar email al propietario (solo para el principal)
    await sendNewGuestEmail(mainGuest);

    // Opcionalmente enviar confirmación al invitado
    if (process.env.SEND_CONFIRMATION_EMAIL === "true" && mainGuest.email) {
      await sendGuestConfirmationEmail(mainGuest);
    }

    res.status(201).json({
      success: true,
      data: mainGuest,
      allGuests: createdGuests,
      message: `${totalAttendees} guest(s) created and assigned to table ID ${tableId}`,
    });
  } catch (error) {
    console.error("Error creating guest(s):", error);
    res.status(500).json({
      success: false,
      error: "Error creating guest(s)",
      message: error.message,
    });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
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
    } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    // Verificar que el invitado existe
    const existingGuest = await Guest.getGuestById(id);
    if (!existingGuest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found",
      });
    }

    const updatedGuest = await Guest.updateGuest(id, {
      name,
      email,
      phone,
      attending: attending !== undefined ? attending : existingGuest.attending,
      mealType: mealType || "normal",
      needsTransport:
        needsTransport !== undefined
          ? needsTransport
          : existingGuest.needsTransport,
      allergies,
      notes,
      tableId: tableId !== undefined ? tableId : null,
    });

    res.json({
      success: true,
      data: updatedGuest,
      message: "Guest updated successfully",
    });
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({
      success: false,
      error: "Error updating guest",
      message: error.message,
    });
  }
};

export const patchGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const partialData = req.body;

    // Verificar que el invitado existe
    const existingGuest = await Guest.getGuestById(id);
    if (!existingGuest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found",
      });
    }

    const updatedGuest = await Guest.patchGuest(id, partialData);

    res.json({
      success: true,
      data: updatedGuest,
      message: "Guest partially updated successfully",
    });
  } catch (error) {
    console.error("Error patching guest:", error);
    res.status(500).json({
      success: false,
      error: "Error patching guest",
      message: error.message,
    });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el invitado existe
    const guest = await Guest.getGuestById(id);
    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found",
      });
    }

    const result = await Guest.deleteGuest(id);

    res.json({
      success: true,
      data: result,
      message: "Guest deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting guest:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting guest",
      message: error.message,
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await Guest.getGuestStats();

    res.json({
      success: true,
      data: {
        total: stats.totalGuests,
        confirmed: stats.confirmados,
        pending: stats.pendientes,
        needTransport: stats.needTransport,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching stats",
      message: error.message,
    });
  }
};

export const getAttendanceStats = async (req, res) => {
  try {
    const stats = await Guest.getAttendanceStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching attendance stats",
      message: error.message,
    });
  }
};

export const getTransportationStats = async (req, res) => {
  try {
    const stats = await Guest.getTransportationStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching transportation stats:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching transportation stats",
      message: error.message,
    });
  }
};

export const getAllergiesStats = async (req, res) => {
  try {
    const stats = await Guest.getAllergiesStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching allergies stats:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching allergies stats",
      message: error.message,
    });
  }
};

export const resetDatabase = async (req, res) => {
  try {
    // Importar la función de reseteo
    const db = (await import("../db.js")).default;

    db.serialize(() => {
      db.run("DELETE FROM preferences", (err) => {
        if (err) console.error("Error clearing preferences:", err);
      });

      db.run("DELETE FROM companions", (err) => {
        if (err) console.error("Error clearing companions:", err);
      });

      db.run("DELETE FROM guests", (err) => {
        if (err) console.error("Error clearing guests:", err);
      });

      db.run("DELETE FROM sqlite_sequence", (err) => {
        if (err) console.error("Error resetting IDs:", err);
      });
    });

    setTimeout(() => {
      res.json({
        success: true,
        message: "Database reset successfully",
        data: {
          tables_cleared: ["guests", "companions", "preferences"],
          ids_reset: true,
        },
      });
    }, 300);
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({
      success: false,
      error: "Error resetting database",
      message: error.message,
    });
  }
};
