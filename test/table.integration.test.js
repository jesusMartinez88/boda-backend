import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = process.env.DB_PATH || "file:data/wedding.table.test.db";

const { default: app } = await import("../src/app.js");
const { default: db } = await import("../src/db.js");

const token = jwt.sign({ id: 1, userId: 1, role: "admin", slug: "admin" }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});
const authHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const server = app.listen(0);
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/api/tables`;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    body: await response.json(),
  };
};

const resetTables = async () => {
  await db.run("DELETE FROM tables");
  await db.run("DELETE FROM sqlite_sequence WHERE name = 'tables'");
};

test.beforeEach(async () => {
  await resetTables();
});

test.after(async () => {
  await resetTables();
  await new Promise((resolve) => server.close(resolve));
});

test("PATCH /api/tables/:id updates highchairs and persists value", async () => {
  const createResponse = await request("/", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Mesa alta",
      capacity: 8,
    }),
  });

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.body.success, true);
  const tableId = createResponse.body.data.id;

  const patchResponse = await request(`/${tableId}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ highchairs: 2 }),
  });

  assert.equal(patchResponse.status, 200);
  assert.equal(patchResponse.body.success, true);
  assert.equal(patchResponse.body.data.highchairs, 2);

  const getResponse = await request(`/${tableId}`, {
    method: "GET",
    headers: authHeaders,
  });

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.success, true);
  assert.equal(getResponse.body.data.highchairs, 2);
});
