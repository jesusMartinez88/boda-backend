import db from "../db.js";

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
  return rows || [];
};

export const getContactById = async (id) => {
  return await db.get("SELECT * FROM contacts WHERE id = ?", [id]);
};

export const createContact = async (contactData) => {
  const { name, phone, side } = contactData;

  const result = await db.run(
    `INSERT INTO contacts (name, phone, side) VALUES (?, ?, ?)`,
    [name, phone, side]
  );

  return { id: result.lastID, ...contactData, linkSent: 0 };
};

export const createContactsBulk = async (contacts) => {
  const queries = contacts.map(c => ({
    sql: `INSERT INTO contacts (name, phone, side) VALUES (?, ?, ?)`,
    args: [c.name, c.phone, c.side]
  }));
  
  await db.batch(queries);
  return { success: true, count: contacts.length };
};

export const updateContact = async (id, contactData) => {
  const { name, phone, side, linkSent, sentAt } = contactData;

  await db.run(
    `UPDATE contacts SET name = ?, phone = ?, side = ?, linkSent = ?, sentAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      name,
      phone,
      side,
      linkSent ? 1 : 0,
      sentAt || null,
      id
    ]
  );

  return { id, ...contactData };
};

export const patchContact = async (id, partialData) => {
  const allowedFields = ["name", "phone", "side", "linkSent", "sentAt"];
  const fields = Object.keys(partialData).filter(f => allowedFields.includes(f));
  
  if (fields.length === 0) return await getContactById(id);

  const setClause = fields.map(f => `${f} = ?`).join(", ");
  const params = fields.map(f => {
    const val = partialData[f];
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
