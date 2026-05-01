import db from "../db.js";

// Mapper para convertir snake_case de DB a camelCase para API
const mapContactFromDb = (contact) => {
  if (!contact) return null;
  const { country_code, ...rest } = contact;
  return {
    ...rest,
    countryCode: country_code
  };
};

export const getAllContacts = async (filters = {}) => {
  let query = "SELECT * FROM contacts WHERE 1=1";
  const params = [];

  if (filters.side) {
    query += " AND side = ?";
    params.push(filters.side);
  }

  if (filters.linkSent !== undefined) {
    query += " AND linkSent = ?";
    params.push(filters.linkSent ? 1 : 0);
  }

  query += " ORDER BY name ASC";

  const rows = await db.all(query, params);
  return (rows || []).map(mapContactFromDb);
};

export const getContactById = async (id) => {
  const contact = await db.get("SELECT * FROM contacts WHERE id = ?", [id]);
  return mapContactFromDb(contact);
};

export const createContact = async (contactData) => {
  const { name, phone, side, countryCode = '+34' } = contactData;

  const result = await db.run(
    `INSERT INTO contacts (name, phone, side, country_code) VALUES (?, ?, ?, ?)`,
    [name, phone, side, countryCode]
  );

  return { id: result.lastID, ...contactData, countryCode, linkSent: 0 };
};

export const createContactsBulk = async (contacts) => {
  const queries = contacts.map(c => ({
    sql: `INSERT INTO contacts (name, phone, side, country_code) VALUES (?, ?, ?, ?)`,
    args: [c.name, c.phone, c.side, c.countryCode || '+34']
  }));
  
  await db.batch(queries);
  return { success: true, count: contacts.length };
};

export const updateContact = async (id, contactData) => {
  const { name, phone, side, countryCode, linkSent, sentAt } = contactData;

  await db.run(
    `UPDATE contacts SET name = ?, phone = ?, side = ?, country_code = ?, linkSent = ?, sentAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      name,
      phone,
      side,
      countryCode || '+34',
      linkSent ? 1 : 0,
      sentAt || null,
      id
    ]
  );

  return { id, ...contactData };
};

export const patchContact = async (id, partialData) => {
  const allowedFields = ["name", "phone", "side", "countryCode", "linkSent", "sentAt"];
  
  // Mapear countryCode a country_code para la DB
  const dbData = { ...partialData };
  if ('countryCode' in dbData) {
    dbData.country_code = dbData.countryCode;
    delete dbData.countryCode;
  }
  
  const fields = Object.keys(dbData).filter(f => 
    allowedFields.includes(f) || f === 'country_code'
  );
  
  if (fields.length === 0) return await getContactById(id);

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => {
    const val = dbData[f];
    if (f === "linkSent") return val ? 1 : 0;
    return val;
  });
  params.push(id);

  await db.run(
    `UPDATE contacts SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    params
  );

  return await getContactById(id);
};

export const deleteContact = async (id) => {
  const result = await db.run("DELETE FROM contacts WHERE id = ?", [id]);
  return { deletedId: id, changes: result.changes };
};
