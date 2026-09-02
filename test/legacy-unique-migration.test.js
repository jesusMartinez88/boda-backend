import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@libsql/client";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = "file:data/wedding.legacy-unique.test.db";

const setupLegacyDatabase = async () => {
  const client = createClient({ url: process.env.DB_PATH });
  await client.batch([
    { sql: "DROP TABLE IF EXISTS contact_categories", args: [] },
    { sql: "DROP TABLE IF EXISTS tables", args: [] },
    { sql: "DROP TABLE IF EXISTS users", args: [] },
    {
      sql: `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        slug TEXT UNIQUE NOT NULL,
        email TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        capacity INTEGER,
        shape TEXT DEFAULT 'round',
        posX REAL DEFAULT 0,
        posY REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE contact_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: [],
    },
    {
      sql: "INSERT INTO users (username, password, role, slug) VALUES ('legacy-admin', 'unused', 'admin', 'legacy-admin')",
      args: [],
    },
    {
      sql: "INSERT INTO tables (name, capacity) VALUES ('Mesa legacy', 8)",
      args: [],
    },
    {
      sql: "INSERT INTO contact_categories (name, slug) VALUES ('Legacy', 'legacy')",
      args: [],
    },
  ]);
  client.close();
};

await setupLegacyDatabase();
const { default: db, initializationPromise } = await import("../src/db.js");
await initializationPromise;

test.after(async () => {
  await db.run("DELETE FROM users WHERE username = 'legacy-user'");
});

test("recreates legacy tables and keeps existing IDs", async () => {
  const legacyTable = await db.get(
    "SELECT id, userId FROM tables WHERE name = 'Mesa legacy'",
  );
  const legacyCategory = await db.get(
    "SELECT id, userId FROM contact_categories WHERE slug = 'legacy'",
  );

  assert.equal(legacyTable.id, 1);
  assert.equal(legacyCategory.id, 1);
  assert.equal(legacyTable.userId, 1);
  assert.equal(legacyCategory.userId, 1);

  const user = await db.run(
    "INSERT INTO users (username, password, role, slug) VALUES ('legacy-user', 'unused', 'user', 'legacy-user')",
  );
  await assert.doesNotReject(() =>
    db.run(
      "INSERT INTO tables (userId, name, capacity) VALUES (?, 'Mesa legacy', 8)",
      [user.lastID],
    ),
  );
  await assert.doesNotReject(() =>
    db.run(
      "INSERT INTO contact_categories (userId, name, slug) VALUES (?, 'Legacy', 'legacy')",
      [user.lastID],
    ),
  );
});
