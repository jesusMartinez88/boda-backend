import * as Guest from "../models/guest.js";
import * as Setting from "../models/setting.js";
import db from "../db.js";
import { promisify } from "util";
import {
  sendNewGuestEmail,
  sendGuestConfirmationEmail,
  sendDeleteCodeEmail,
} from "../services/emailService.js";
import { table } from "console";

// Ya no necesitamos promisify porque db.all ya devuelve una promesa
const dbAll = db.all;

// sistema simple de código de confirmación para borrado masivo
let pendingDeleteCode = null;
let pendingDeleteExpiry = null;

const generateDeleteCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const assignRandomTable = async (neededSpace = 1) => {
  try {
    // 1. Obtener capacidad máxima global por defecto
    const globalMaxStr = await Setting.getSetting("max_guests_per_table");
    const globalMax = parseInt(globalMaxStr || "10", 10);

    // 2. Obtener definiciones de mesas específicas
    const tableDefinitions = await dbAll(
      "SELECT id, name, capacity FROM tables",
    );
    const tableInfo = {};
    tableDefinitions.forEach((t) => {
      tableInfo[t.id] = { name: t.name, capacity: t.capacity || globalMax };
    });

    // 3. Obtener ocupación actual de las mesas
    const tableCounts = await dbAll(
      "SELECT tableId, COUNT(*) as count FROM guests WHERE tableId IS NOT NULL GROUP BY tableId",
    );

    // 4. Identificar ocupación
    const currentOccupancy = {};
    tableCounts.forEach((t) => {
      currentOccupancy[t.tableId] = t.count;
    });

    const availableTableIds = [];

    Object.keys(tableInfo).forEach((id) => {
      const info = tableInfo[id];
      const occupied = currentOccupancy[id] || 0;
      if (info.capacity - occupied >= neededSpace) {
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

// Asignar una lista de asientos libres dentro de una mesa concreta
const assignSeatsForTable = async (tableId, neededSeats = 1) => {
  if (!tableId || neededSeats <= 0) return [];

  try {
    // 1. Obtener capacidad de la mesa (o usar capacidad global por defecto)
    const globalMaxStr = await Setting.getSetting("max_guests_per_table");
    const globalMax = parseInt(globalMaxStr || "10", 10);

    const tableRows = await dbAll("SELECT capacity FROM tables WHERE id = ?", [
      tableId,
    ]);

    const tableCapacity =
      tableRows && tableRows.length > 0
        ? tableRows[0].capacity || globalMax
        : globalMax;

    // 2. Obtener asientos ya ocupados en esa mesa
    const takenSeatRows = await dbAll(
      "SELECT seatNumber FROM guests WHERE tableId = ? AND seatNumber IS NOT NULL",
      [tableId],
    );

    const takenSeats = new Set(
      takenSeatRows
        .map((r) => r.seatNumber)
        .filter((n) => n !== null && n !== undefined),
    );

    // 3. Calcular asientos libres (1..capacity)
    const freeSeats = [];
    for (let i = 1; i <= tableCapacity; i++) {
      if (!takenSeats.has(i)) {
        freeSeats.push(i);
      }
    }

    if (freeSeats.length < neededSeats) {
      // No hay suficientes asientos libres para todo el grupo
      return [];
    }

    // 4. Devolver los primeros N asientos libres (podríamos aleatorizar si se desea)
    return freeSeats.slice(0, neededSeats);
  } catch (error) {
    console.error("Error in assignSeatsForTable:", error);
    return [];
  }
};

// Validar que una mesa tiene capacidad disponible
const validateTableCapacity = async (tableId, guestId) => {
  try {
    if (!tableId) return { valid: true }; // Sin mesa asignada es válido

    const globalMaxStr = await Setting.getSetting("max_guests_per_table");
    const globalMax = parseInt(globalMaxStr || "10", 10);

    // Obtener la definición de la mesa
    const tableDef = await dbAll(
      "SELECT id, name, capacity FROM tables WHERE id = ?",
      [tableId],
    );

    if (!tableDef || tableDef.length === 0) {
      return { valid: false, error: `Table with ID ${tableId} not found` };
    }

    const table = tableDef[0];
    const capacity = table.capacity || globalMax;

    // Obtener ocupación actual (excluyendo el invitado actual)
    const occupancyResult = await dbAll(
      "SELECT COUNT(*) as count FROM guests WHERE tableId = ? AND id != ?",
      [tableId, guestId],
    );

    const currentCount = occupancyResult[0]?.count || 0;

    if (currentCount >= capacity) {
      return {
        valid: false,
        error: `Table "${table.name}" (ID ${tableId}) is full. Current: ${currentCount}/${capacity}`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating table capacity:", error);
    return { valid: false, error: error.message };
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
      adults,
      children,
      attendance,
      mealType,
      needsTransport,
      allergies,
      notes,
      sendEmail,
      isAdult = true,
    } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required",
      });
    }

    const finalChildren =
      req.body.childrens !== undefined ? req.body.childrens : children;
    const numAdults = parseInt(adults || "1", 10);
    const numChildren = parseInt(finalChildren || "0", 10);
    const totalAttendees = numAdults + numChildren;
    const isAttending =
      attendance !== false &&
      attendance !== "false" &&
      attendance !== 0 &&
      attendance !== "0";

    // FEATURE: Asignar mesa de grupo - respetar setting auto_assign_tables
    const autoAssignStr = await Setting.getSetting("auto_assign_tables");
    const autoAssign =
      autoAssignStr === "true" ||
      autoAssignStr === "1" ||
      autoAssignStr === true;
    const createdGuests = [];

    let tableId =
      autoAssign && isAttending
        ? await assignRandomTable(totalAttendees)
        : null;
    let seatNumbers = [];

    // Si hay mesa asignada y el grupo asiste, intentamos asignar asientos
    if (tableId && isAttending && totalAttendees > 0) {
      seatNumbers = await assignSeatsForTable(tableId, totalAttendees);
    }
    if (!seatNumbers.length) {
      tableId = null; // Si no se pudieron asignar asientos, no asignamos mesa para evitar inconsistencias
    }

    const getSeatNumberForIndex = (index) => {
      if (!seatNumbers || seatNumbers.length === 0) return null;
      return seatNumbers[index] !== undefined ? seatNumbers[index] : null;
    };

    // 1. Crear invitado principal
    const mainGuest = await Guest.createGuest({
      name: `${name} ${isAdult ? "" : "- Niño"}`,
      email,
      phone,
      attending: isAttending,
      mealType: mealType || "normal",
      needsTransport: needsTransport || false,
      allergies,
      notes,
      tableId,
      seatNumber: getSeatNumberForIndex(0),
      isAdult: isAdult,
    });
    createdGuests.push(mainGuest);

    if (numAdults > 1) {
      // 2. Crear adultos adicionales (si adults > 1)
      for (let i = 1; i < numAdults; i++) {
        const adultGuest = await Guest.createGuest({
          name: `${name} - Acompañante ${i}`,
          email: null,
          phone: null,
          attending: isAttending,
          mealType: "normal",
          needsTransport: needsTransport || false,
          allergies: null,
          notes: `Acompañante de ${name}`,
          tableId,
          seatNumber: getSeatNumberForIndex(i),
          isAdult: true,
        });
        createdGuests.push(adultGuest);
      }
    }

    if (isAdult) {
      // 3. Crear niños
      for (let i = 0; i < numChildren; i++) {
        const childGuest = await Guest.createGuest({
          name: `${name} - Niño ${i + 1}`,
          email: null,
          phone: null,
          attending: isAttending,
          mealType: "normal",
          needsTransport: needsTransport || false,
          allergies: null,
          notes: `Niño/a de ${name}`,
          tableId,
          seatNumber: getSeatNumberForIndex(numAdults + i),
          isAdult: false,
        });
        createdGuests.push(childGuest);
      }
    }

    if (sendEmail !== false) {
      // Enviar email al propietario (solo para el principal)
      await sendNewGuestEmail(mainGuest, numAdults, numChildren);
    }

    // Opcionalmente enviar confirmación al invitado
    if (process.env.SEND_CONFIRMATION_EMAIL === "true" && mainGuest.email) {
      await sendGuestConfirmationEmail(mainGuest);
    }

    let message = `${totalAttendees} invitado(s) creados (${numAdults} adultos, ${numChildren} niños) - Estado: ${isAttending ? "Confirmado" : "No confirma"})`;
    if (isAttending) {
      if (tableId) {
        message += ` asignados a mesa ID ${tableId}`;
      } else {
        message += ` (sin mesa asignada, quedan en "por asignar")`;
      }
    }

    res.status(201).json({
      success: true,
      data: mainGuest,
      allGuests: createdGuests,
      message,
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
      seatNumber,
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

    // Validar capacidad de la mesa si se intenta asignar una
    if (tableId !== undefined && tableId !== null) {
      const capacityCheck = await validateTableCapacity(tableId, id);
      if (!capacityCheck.valid) {
        return res.status(400).json({
          success: false,
          error: "Invalid table assignment",
          message: capacityCheck.error,
        });
      }
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
      seatNumber: seatNumber !== undefined ? seatNumber : null,
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

    // Validar capacidad de la mesa si se intenta asignar una
    if (partialData.tableId !== undefined && partialData.tableId !== null) {
      const capacityCheck = await validateTableCapacity(
        partialData.tableId,
        id,
      );
      if (!capacityCheck.valid) {
        return res.status(400).json({
          success: false,
          error: "Invalid table assignment",
          message: capacityCheck.error,
        });
      }
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

// solicita envío de código de confirmación para borrado de todos
export const requestDeleteCode = async (req, res) => {
  try {
    // generar y guardar código con expiración (15 minutos)
    pendingDeleteCode = generateDeleteCode();
    pendingDeleteExpiry = Date.now() + 15 * 60 * 1000;

    // log para desarrollo
    console.log("🔐 Código de borrado generado:", pendingDeleteCode);

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

// controlador para borrar todos los invitados
export const deleteAllGuests = async (req, res) => {
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

    const result = await Guest.deleteAllGuests();
    res.json({
      success: true,
      data: result,
      message: "All guests deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting all guests:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting all guests",
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
        totalAdults: stats.totalAdults || 0,
        totalChildren: stats.totalChildren || 0,
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

    // Refactorizado a async/await secuencial
    await db.run("DELETE FROM preferences");
    await db.run("DELETE FROM companions");
    await db.run("DELETE FROM guests");
    await db.run("DELETE FROM sqlite_sequence");

    res.json({
      success: true,
      message: "Database reset successfully",
      data: {
        tables_cleared: ["guests", "companions", "preferences"],
        ids_reset: true,
      },
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({
      success: false,
      error: "Error resetting database",
      message: error.message,
    });
  }
};
