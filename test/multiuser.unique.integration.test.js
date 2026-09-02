import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = process.env.DB_PATH || "file:data/wedding.unique.test.db";

const { default: db, initializationPromise } = await import("../src/db.js");
await import("../src/app.js");
await initializationPromise;

const userIds = [];

test.before(async () => {
  for (const suffix of ["table", "category"]) {
    const result = await db.run(
      "INSERT INTO users (username, password, role, slug) VALUES (?, ?, 'user', ?)",
      [
        `unique-test-${suffix}-${Date.now()}`,
        "unused",
        `unique-test-${suffix}-${Date.now()}`,
      ],
    );
    userIds.push(result.lastID);
  }
});

test.after(async () => {
  await db.run("DELETE FROM users WHERE id IN (?, ?)", userIds);
});

test("different users can use the same table name", async () => {
  await db.run("INSERT INTO tables (userId, name, capacity) VALUES (?, ?, ?)", [
    userIds[0],
    "Mesa compartida",
    8,
  ]);

  await assert.doesNotReject(() =>
    db.run("INSERT INTO tables (userId, name, capacity) VALUES (?, ?, ?)", [
      userIds[1],
      "Mesa compartida",
      8,
    ]),
  );
});

test("different users can use the same contact category name and slug", async () => {
  await db.run(
    "INSERT INTO contact_categories (userId, name, slug) VALUES (?, ?, ?)",
    [userIds[0], "Familia", "familia"],
  );

  await assert.doesNotReject(() =>
    db.run(
      "INSERT INTO contact_categories (userId, name, slug) VALUES (?, ?, ?)",
      [userIds[1], "Familia", "familia"],
    ),
  );
});
