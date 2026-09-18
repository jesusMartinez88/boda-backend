import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = "file:data/wedding.password-reset.test.db";

const { default: app } = await import("../src/app.js");
const { default: db } = await import("../src/db.js");
const User = await import("../src/models/user.js");

const server = app.listen(0);
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/api/auth`;

test("password reset flow with email verification code", async (t) => {
  // 1. Create a test user with email
  const username = "resetuser";
  const password = "OldPassword123!";
  const email = "resetuser@example.com";
  
  // Clean up any existing user
  const existing = await User.findByUsername(username);
  let userId;
  if (existing) {
    userId = existing.id;
    await User.updatePassword(userId, password);
    await db.run("UPDATE users SET email = ? WHERE id = ?", [email, userId]);
  } else {
    const created = await User.createUser({
      username,
      email,
      password,
      role: "user",
      slug: "resetuser",
    });
    userId = created.id;
  }

  const token = jwt.sign(
    { id: userId, username, role: "user", slug: "resetuser" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  await t.test("POST /api/auth/me/request-reset-code generates code and returns masked email", async () => {
    const res = await fetch(`${baseUrl}/me/request-reset-code`, {
      method: "POST",
      headers: authHeaders,
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.code, "Development/test environment returns code");
    assert.match(body.code, /^\d{6}$/, "Code is 6 digits");
    assert.ok(body.message.includes("resetuser@example.com") || body.message.includes("***"));

    // Check that code is saved in database
    const dbRecord = await db.get(
      "SELECT * FROM password_reset_codes WHERE userId = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [userId],
    );
    assert.ok(dbRecord, "Code is recorded in DB");
    assert.equal(dbRecord.code, body.code);
    assert.equal(dbRecord.used, 0);
  });

  await t.test("POST /api/auth/me/reset-password-with-code fails on incorrect code", async () => {
    const res = await fetch(`${baseUrl}/me/reset-password-with-code`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: "000000",
        newPassword: "NewSecretPassword456!",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /incorrecto/i);
  });

  await t.test("POST /api/auth/me/reset-password-with-code fails when password < 8 chars", async () => {
    // Get valid code from DB
    const dbRecord = await db.get(
      "SELECT * FROM password_reset_codes WHERE userId = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [userId],
    );

    const res = await fetch(`${baseUrl}/me/reset-password-with-code`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: dbRecord.code,
        newPassword: "short",
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.match(body.message, /8 caracteres/i);
  });

  await t.test("POST /api/auth/me/reset-password-with-code succeeds with valid code and updates password", async () => {
    const dbRecord = await db.get(
      "SELECT * FROM password_reset_codes WHERE userId = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [userId],
    );

    const newPassword = "BrandNewPassword2026!";
    const res = await fetch(`${baseUrl}/me/reset-password-with-code`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: dbRecord.code,
        newPassword,
      }),
    });

    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.match(body.message, /actualizada correctamente/i);

    // Verify code is now marked used
    const updatedRecord = await db.get(
      "SELECT * FROM password_reset_codes WHERE id = ?",
      [dbRecord.id],
    );
    assert.equal(updatedRecord.used, 1);

    // Verify user can login with new password
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: newPassword }),
    });
    const loginBody = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginBody.success, true);
    assert.ok(loginBody.token);

    // Verify old password fails
    const oldLoginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    assert.equal(oldLoginRes.status, 401);
  });

  server.close();
});
