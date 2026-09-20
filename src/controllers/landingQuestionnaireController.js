import * as Questionnaire from "../models/landingQuestionnaire.js";
import * as User from "../models/user.js";
import { logError } from "../utils/logger.js";

const PROTECTED_ADMIN_USERNAME = "admin";

/**
 * GET /api/landing-questionnaire
 * Devuelve el cuestionario del usuario autenticado. 200 con `data: null`
 * si aún no lo ha rellenado (el frontend lo distingue de "no contestado").
 */
export const getMine = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await Questionnaire.findByUserId(userId);
    res.json({ success: true, data });
  } catch (error) {
    logError("Error fetching own landing questionnaire", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/landing-questionnaire
 * Crea o actualiza el cuestionario del usuario autenticado.
 *
 * El flujo previsto es: el cliente rellena el cuestionario justo después
 * de registrarse, antes de acceder al dashboard. El modelo hace el upsert
 * (UNIQUE por userId), así que es seguro llamarlo varias veces.
 */
export const saveMine = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate: if hasContactBrideGroom is truthy, a phone number is required.
    const body = req.body || {};
    const wantsContact =
      body.hasContactBrideGroom === true ||
      body.hasContactBrideGroom === "true" ||
      body.hasContactBrideGroom === 1 ||
      body.hasContactBrideGroom === "1" ||
      body.hasContactBrideGroom === "yes";
    const phone = body.contactBrideGroomPhone;
    if (wantsContact && (!phone || String(phone).trim() === "")) {
      return res.status(422).json({
        success: false,
        message: "A phone number is required when 'contact bride/groom' is enabled",
        field: "contactBrideGroomPhone",
      });
    }

    const data = await Questionnaire.upsert(userId, body);
    res.json({
      success: true,
      data,
      message: "Cuestionario guardado correctamente",
    });
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({
        success: false,
        message: error.message,
        field: error.field,
      });
    }
    logError("Error saving own landing questionnaire", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * PUT /api/admin/users/:id/landing-questionnaire
 * Permite al admin crear o sobreescribir el cuestionario de cualquier
 * usuario. Útil cuando el cliente no pudo enviarlo durante el registro.
 */
export const saveForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (target.username === PROTECTED_ADMIN_USERNAME) {
      return res.status(403).json({
        success: false,
        message: "Cannot write the main admin questionnaire",
      });
    }

    const data = await Questionnaire.upsert(Number(id), req.body || {});
    res.json({
      success: true,
      data,
      message: "Cuestionario guardado correctamente",
    });
  } catch (error) {
    if (error.status === 422) {
      return res.status(422).json({
        success: false,
        message: error.message,
        field: error.field,
      });
    }
    logError("Error saving user landing questionnaire (admin)", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/users/:id/landing-questionnaire
 * Devuelve el cuestionario de un usuario concreto. Solo accesible por
 * admins; mismas reglas de protección que el resto de endpoints admin
 * (no se puede leer el cuestionario del admin principal ni el del
 * propio admin que consulta).
 */
export const getForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const target = await User.findById(id);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (target.username === PROTECTED_ADMIN_USERNAME) {
      return res.status(403).json({
        success: false,
        message: "Cannot read the main admin questionnaire",
      });
    }

    const data = await Questionnaire.findByUserId(id);
    res.json({ success: true, data });
  } catch (error) {
    logError("Error fetching user landing questionnaire", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
