import * as Guest from "../models/guest.js";

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
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    const newGuest = await Guest.createGuest({
      name,
      email,
      phone,
      attending: attending || false,
      mealType: mealType || "normal",
      needsTransport: needsTransport || false,
      allergies,
      notes,
    });

    res.status(201).json({
      success: true,
      data: newGuest,
      message: "Guest created successfully",
    });
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({
      success: false,
      error: "Error creating guest",
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
    } = req.body;

    // Validación básica
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
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
