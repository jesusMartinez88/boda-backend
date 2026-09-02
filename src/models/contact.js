import db from "../db.js";

// Mapper para convertir snake_case de DB a camelCase para API
const mapContactFromDb = (contact) => {
  if (!contact) return null;
  const { country_code, invitation_status, responded_at, ...rest } = contact;
  return {
    ...rest,
    countryCode: country_code,
    invitationStatus: invitation_status || 'not_sent',
    respondedAt: responded_at || null
  };
};

export const getAllContacts = async (filters = {}, userId) => {
  let query = "SELECT * FROM contacts WHERE userId = ?";
  const params = [userId];

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

export const getContactById = async (id, userId) => {
  const contact = userId !== undefined
    ? await db.get("SELECT * FROM contacts WHERE id = ? AND userId = ?", [id, userId])
    : await db.get("SELECT * FROM contacts WHERE id = ?", [id]);
  return mapContactFromDb(contact);
};

export const createContact = async (contactData) => {
  const { userId, name, phone, side, countryCode = '+34' } = contactData;

  const result = await db.run(
    `INSERT INTO contacts (userId, name, phone, side, country_code, invitation_status) VALUES (?, ?, ?, ?, ?, 'not_sent')`,
    [userId || null, name, phone, side, countryCode]
  );

  return { id: result.lastID, ...contactData, countryCode, linkSent: 0, invitationStatus: 'not_sent' };
};

export const createContactsBulk = async (contacts, userId) => {
  const queries = contacts.map(c => ({
    sql: `INSERT INTO contacts (userId, name, phone, side, country_code) VALUES (?, ?, ?, ?, ?)`,
    args: [userId || null, c.name, c.phone, c.side, c.countryCode || '+34']
  }));

  await db.batch(queries);
  return { success: true, count: contacts.length };
};

export const updateContact = async (id, contactData, userId) => {
  const { name, phone, side, countryCode, linkSent, sentAt } = contactData;
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const whereParams = userId !== undefined ? [id, userId] : [id];

  await db.run(
    `UPDATE contacts SET name = ?, phone = ?, side = ?, country_code = ?, linkSent = ?, sentAt = ?, updatedAt = CURRENT_TIMESTAMP ${whereClause}`,
    [
      name,
      phone,
      side,
      countryCode || '+34',
      linkSent ? 1 : 0,
      sentAt || null,
      ...whereParams,
    ]
  );

  return { id, ...contactData };
};

export const patchContact = async (id, partialData, userId) => {
  const allowedFields = ["name", "phone", "side", "countryCode", "linkSent", "sentAt", "invitationStatus", "respondedAt"];

  // Mapear countryCode a country_code para la DB
  const dbData = { ...partialData };
  if ('countryCode' in dbData) {
    dbData.country_code = dbData.countryCode;
    delete dbData.countryCode;
  }
  if ('invitationStatus' in dbData) {
    dbData.invitation_status = dbData.invitationStatus;
    delete dbData.invitationStatus;
  }
  if ('respondedAt' in dbData) {
    dbData.responded_at = dbData.respondedAt;
    delete dbData.respondedAt;
  }

  const fields = Object.keys(dbData).filter(f =>
    allowedFields.includes(f) || f === 'country_code' || f === 'invitation_status' || f === 'responded_at'
  );

  if (fields.length === 0) return await getContactById(id, userId);

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => {
    const val = dbData[f];
    if (f === "linkSent") return val ? 1 : 0;
    return val;
  });

  if (userId !== undefined) {
    params.push(id, userId);
    await db.run(
      `UPDATE contacts SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
      params
    );
  } else {
    params.push(id);
    await db.run(
      `UPDATE contacts SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );
  }

  return await getContactById(id, userId);
};

export const deleteContact = async (id, userId) => {
  const whereClause = userId !== undefined ? "WHERE id = ? AND userId = ?" : "WHERE id = ?";
  const params = userId !== undefined ? [id, userId] : [id];
  const result = await db.run(`DELETE FROM contacts ${whereClause}`, params);
  return { deletedId: id, changes: result.changes };
};
