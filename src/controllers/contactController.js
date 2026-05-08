import * as ContactModel from "../models/contact.js";
import { isValidPhoneNumber } from "libphonenumber-js";
import { logWarn } from "../utils/logger.js";
import { validateFields, sanitizeObject, FIELD_LIMITS } from "../utils/validation.js";

export const getContacts = async (req, res) => {
  try {
    const { side, linkSent } = req.query;
    const filters = {};
    if (side) filters.side = side;
    if (linkSent !== undefined) filters.linkSent = linkSent === "true" || linkSent === "1";

    const contacts = await ContactModel.getAllContacts(filters);
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Valida un número de teléfono según el código de país
 * @param {string} phone - Número de teléfono sin código de país
 * @param {string} countryCode - Código de país (ej: +34, +1, +44)
 * @returns {boolean} - true si el teléfono es válido
 */
const isValidPhone = (phone, countryCode = '+34') => {
  if (!phone) return false;
  
  try {
    // Construir el número completo
    const fullNumber = `${countryCode}${phone}`;
    
    // Validar usando libphonenumber-js
    return isValidPhoneNumber(fullNumber);
  } catch (error) {
    logWarn("Phone validation error", { phone, countryCode, error: error.message });
    return false;
  }
};

/**
 * Valida el formato del código de país
 * @param {string} countryCode - Código de país (ej: +34, +1, +44)
 * @returns {boolean} - true si el formato es válido
 */
const isValidCountryCode = (countryCode) => {
  if (!countryCode) return false;
  return /^\+\d{1,3}$/.test(countryCode);
};

export const createContact = async (req, res) => {
  try {
    const contactData = req.body;

    const validate = (data) => {
      // Validar campos obligatorios
      if (!data.name || !data.phone) {
        throw new Error("Nombre y teléfono son obligatorios");
      }
      
      // Validar longitud de campos
      const lengthValidation = validateFields(data, {
        name: FIELD_LIMITS.CONTACT_NAME,
        phone: FIELD_LIMITS.GUEST_PHONE,
      });
      
      if (!lengthValidation.valid) {
        throw new Error(lengthValidation.errors.join(", "));
      }
      
      // Sanitizar todos los campos de texto (eliminar HTML)
      const sanitized = sanitizeObject(data, ['name', 'phone', 'side']);
      Object.assign(data, sanitized);
      
      // Validar código de país
      const countryCode = data.countryCode || '+34';
      
      if (!isValidCountryCode(countryCode)) {
        throw new Error(`Código de país inválido (${countryCode}). Debe tener formato +XX o +XXX.`);
      }
      
      // Validar teléfono
      if (!isValidPhone(data.phone, countryCode)) {
        throw new Error(`Teléfono inválido (${data.phone}) para el país ${countryCode}.`);
      }
    };

    if (Array.isArray(contactData)) {
      contactData.forEach(validate);
      const result = await ContactModel.createContactsBulk(contactData);
      return res.status(201).json({ success: true, data: result });
    }

    validate(contactData);
    const newContact = await ContactModel.createContact(contactData);
    res.status(201).json({ success: true, data: newContact });
  } catch (error) {
    // Si es un error de validación manual, usamos 400. Si no, 500.
    const status = error.message.includes("inválido") || error.message.includes("obligatorios") ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const patchContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ContactModel.patchContact(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await ContactModel.deleteContact(id);
    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
