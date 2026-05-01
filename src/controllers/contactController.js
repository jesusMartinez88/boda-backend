import * as ContactModel from "../models/contact.js";

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

const isValidPhone = (phone) => {
  if (!phone) return false;
  const clean = phone.replace(/\s/g, "").replace(/^\+34|^34/, "");
  return /^[67]\d{8}$/.test(clean);
};

const isValidCountryCode = (countryCode) => {
  if (!countryCode) return false;
  return /^\+\d{1,3}$/.test(countryCode);
};

export const createContact = async (req, res) => {
  try {
    const contactData = req.body;

    const validate = (data) => {
      if (!data.name || !data.phone) throw new Error("Nombre y teléfono son obligatorios");
      if (!isValidPhone(data.phone)) {
        throw new Error(`Teléfono inválido (${data.phone}). Debe empezar por 6 o 7 y tener 9 dígitos.`);
      }
      if (data.countryCode && !isValidCountryCode(data.countryCode)) {
        throw new Error(`Código de país inválido (${data.countryCode}). Debe tener formato +XX o +XXX.`);
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
