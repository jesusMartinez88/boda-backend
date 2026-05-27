import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = process.env.DB_PATH || "file:data/wedding.test.db";

const { default: app } = await import("../src/app.js");
const { default: db } = await import("../src/db.js");

const token = jwt.sign({ userId: 1, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
const authHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

await db.run(`
  CREATE TABLE IF NOT EXISTS music_playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    youtube_id TEXT,
    note TEXT,
    order_index INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const server = app.listen(0);
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/api/music-playlist`;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    body: await response.json(),
  };
};

const resetPlaylist = async () => {
  await db.run("DELETE FROM music_playlist");
};

test.beforeEach(async () => {
  await resetPlaylist();
});

test.after(async () => {
  await resetPlaylist();
  await new Promise((resolve) => server.close(resolve));
});

test("create -> list", async () => {
  const createResponse = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Yellow",
      artist: "Coldplay",
      youtube_url: "https://www.youtube.com/watch?v=yKNxeF4KMsY",
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.success, true);
  assert.equal(createResponse.body.data.youtube_id, "yKNxeF4KMsY");

  const listResponse = await request("/", {
    method: "GET",
    headers: authHeaders,
  });

  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.success, true);
  assert.equal(listResponse.body.data.length, 1);
  assert.equal(listResponse.body.data[0].title, "Yellow");
});

test("create with camelCase payload compatibility", async () => {
  const createResponse = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Fix You",
      artist: "Coldplay",
      youtubeUrl: "https://www.youtube.com/watch?v=k4V3Mo61fJM",
      orderIndex: 0,
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.success, true);
  assert.equal(createResponse.body.data.youtube_id, "k4V3Mo61fJM");
  assert.equal(createResponse.body.data.order_index, 0);
});

test("update song", async () => {
  const created = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Song A",
      artist: "Artist A",
      youtube_url: "https://youtu.be/yKNxeF4KMsY",
    }),
  });

  const songId = created.body.data.id;
  const updateResponse = await request(`/${songId}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Song A+",
      youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    }),
  });

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.body.data.title, "Song A+");
  assert.equal(updateResponse.body.data.youtube_id, "JGwWNGJdvx8");
});

test("delete song", async () => {
  const created = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Song Delete",
      artist: "Artist",
      youtube_url: "https://youtu.be/yKNxeF4KMsY",
    }),
  });

  const songId = created.body.data.id;
  const deleteResponse = await request(`/${songId}`, {
    method: "DELETE",
    headers: authHeaders,
  });

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.success, true);

  const listResponse = await request("/", {
    method: "GET",
    headers: authHeaders,
  });
  assert.equal(listResponse.body.data.length, 0);
});

test("reorder success", async () => {
  const first = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Song 1",
      artist: "Artist",
      youtube_url: "https://youtu.be/yKNxeF4KMsY",
    }),
  });

  const second = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Song 2",
      artist: "Artist",
      youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    }),
  });

  const reorderResponse = await request("/reorder", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      songs: [
        { id: first.body.data.id, order: 1 },
        { id: second.body.data.id, order: 0 },
      ],
    }),
  });

  assert.equal(reorderResponse.status, 200);
  assert.equal(reorderResponse.body.success, true);
  assert.equal(reorderResponse.body.data[0].id, second.body.data.id);
  assert.equal(reorderResponse.body.data[1].id, first.body.data.id);
});

test("reorder rollback on invalid id", async () => {
  const first = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Rollback 1",
      artist: "Artist",
      youtube_url: "https://youtu.be/yKNxeF4KMsY",
    }),
  });

  const second = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Rollback 2",
      artist: "Artist",
      youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    }),
  });

  const beforeRows = await db.all(
    "SELECT id, order_index FROM music_playlist WHERE id IN (?, ?) ORDER BY id ASC",
    [first.body.data.id, second.body.data.id],
  );

  const reorderResponse = await request("/reorder", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      songs: [
        { id: first.body.data.id, order: 9 },
        { id: 999999, order: 8 },
      ],
    }),
  });

  assert.equal(reorderResponse.status, 404);
  assert.equal(reorderResponse.body.success, false);

  const afterRows = await db.all(
    "SELECT id, order_index FROM music_playlist WHERE id IN (?, ?) ORDER BY id ASC",
    [first.body.data.id, second.body.data.id],
  );

  assert.deepEqual(afterRows, beforeRows);
});
