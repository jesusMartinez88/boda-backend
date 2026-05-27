import db from "../db.js";

const BASE_SELECT = `
  SELECT
    id,
    title,
    artist,
    youtube_url,
    youtube_id,
    note,
    order_index,
    created_at,
    updated_at
  FROM music_playlist
`;

export const listSongs = async () => {
  return db.all(`${BASE_SELECT} ORDER BY order_index ASC, id ASC`);
};

export const getSongById = async (id) => {
  return db.get(`${BASE_SELECT} WHERE id = ?`, [id]);
};

export const getNextOrderIndex = async () => {
  const row = await db.get("SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM music_playlist");
  return Number(row?.next_order ?? 0);
};

export const createSong = async (song) => {
  const result = await db.run(
    `INSERT INTO music_playlist (title, artist, youtube_url, youtube_id, note, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [song.title, song.artist, song.youtube_url, song.youtube_id, song.note, song.order_index],
  );

  return getSongById(result.lastID);
};

export const updateSongPartial = async (id, partialData) => {
  const entries = Object.entries(partialData).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return getSongById(id);
  }

  const setClause = entries.map(([field]) => `${field} = ?`).join(", ");
  const params = entries.map(([, value]) => value);
  params.push(id);

  await db.run(
    `UPDATE music_playlist
     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    params,
  );

  return getSongById(id);
};

export const deleteSong = async (id) => {
  return db.run("DELETE FROM music_playlist WHERE id = ?", [id]);
};

export const reorderSongsTransaction = async (songs) => {
  await db.execute("BEGIN TRANSACTION");

  try {
    for (const song of songs) {
      const result = await db.run(
        "UPDATE music_playlist SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [song.order, song.id],
      );

      if (result.changes === 0) {
        const notFoundError = new Error(`Song with id ${song.id} not found`);
        notFoundError.code = "NOT_FOUND";
        throw notFoundError;
      }
    }

    await db.execute("COMMIT");
  } catch (error) {
    await db.execute("ROLLBACK");
    throw error;
  }
};
