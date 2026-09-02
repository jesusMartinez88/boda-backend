import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.DB_PATH = process.env.DB_PATH || "file:data/wedding.multiuser.test.db";

const { default: app } = await import("../src/app.js");
const { default: db } = await import("../src/db.js");

const server = app.listen(0);
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}/api`;

// Utility function to make requests
const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    body: await response.json(),
  };
};

// Test users setup
let userA, userB, tokenA, tokenB, authHeadersA, authHeadersB;

test.before(async () => {
  // Clean up any existing test users
  await db.run("DELETE FROM users WHERE username LIKE 'testuser%'");
  
  // Register test users
  const registerA = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "testuserA",
      email: "usera@test.com",
      password: "password123"
    }),
  });
  
  const registerB = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "testuserB", 
      email: "userb@test.com",
      password: "password123"
    }),
  });
  
  assert.equal(registerA.status, 201, "UserA registration should succeed");
  assert.equal(registerB.status, 201, "UserB registration should succeed");
  
  userA = registerA.body.user;
  userB = registerB.body.user;
  tokenA = registerA.body.token;
  tokenB = registerB.body.token;
  
  authHeadersA = {
    Authorization: `Bearer ${tokenA}`,
    "Content-Type": "application/json",
  };
  
  authHeadersB = {
    Authorization: `Bearer ${tokenB}`,
    "Content-Type": "application/json",
  };
  
  console.log(`UserA: ${userA.username} (slug: ${userA.slug})`);
  console.log(`UserB: ${userB.username} (slug: ${userB.slug})`);
});

test.after(async () => {
  // Cleanup test data
  await db.run("DELETE FROM users WHERE username LIKE 'testuser%'");
  await new Promise((resolve) => server.close(resolve));
});

test("JWT tokens include slug for multiuser context", () => {
  const decodedA = jwt.decode(tokenA);
  const decodedB = jwt.decode(tokenB);
  
  assert.ok(decodedA.slug, "TokenA should include slug");
  assert.ok(decodedB.slug, "TokenB should include slug");
  assert.equal(decodedA.slug, userA.slug, "TokenA slug should match userA");
  assert.equal(decodedB.slug, userB.slug, "TokenB slug should match userB");
});

test("Users can create guests - data isolation", async () => {
  // UserA creates a guest
  const guestA = await request("/guests", {
    method: "POST",
    headers: authHeadersA,
    body: JSON.stringify({
      name: "Guest A",
      email: "guesta@test.com",
      confirmed: true
    }),
  });
  
  // UserB creates a guest  
  const guestB = await request("/guests", {
    method: "POST",
    headers: authHeadersB,
    body: JSON.stringify({
      name: "Guest B",
      email: "guestb@test.com", 
      confirmed: true
    }),
  });
  
  assert.equal(guestA.status, 201, "UserA should create guest successfully");
  assert.equal(guestB.status, 201, "UserB should create guest successfully");
  assert.equal(guestA.body.data.userId, userA.id, "GuestA should belong to userA");
  assert.equal(guestB.body.data.userId, userB.id, "GuestB should belong to userB");
});

test("Users only see their own guests", async () => {
  // UserA lists guests
  const guestsA = await request("/guests", {
    method: "GET", 
    headers: authHeadersA,
  });
  
  // UserB lists guests
  const guestsB = await request("/guests", {
    method: "GET",
    headers: authHeadersB,
  });
  
  assert.equal(guestsA.status, 200, "UserA should list guests successfully");
  assert.equal(guestsB.status, 200, "UserB should list guests successfully");
  
  // Each user should only see their own guests
  const userAGuests = guestsA.body.data.filter(g => g.userId === userA.id);
  const userBGuests = guestsB.body.data.filter(g => g.userId === userB.id);
  
  assert.equal(guestsA.body.data.length, userAGuests.length, "UserA should only see their guests");
  assert.equal(guestsB.body.data.length, userBGuests.length, "UserB should only see their guests");
  
  // Verify no cross-contamination
  assert.ok(guestsA.body.data.every(g => g.userId === userA.id), "All of userA's guests should belong to userA");
  assert.ok(guestsB.body.data.every(g => g.userId === userB.id), "All of userB's guests should belong to userB");
});

test("Users cannot modify other users' guests - ownership validation", async () => {
  // UserA creates a guest
  const guestA = await request("/guests", {
    method: "POST",
    headers: authHeadersA,
    body: JSON.stringify({
      name: "Guest for Ownership Test",
      email: "ownership@test.com",
      confirmed: true
    }),
  });
  
  assert.equal(guestA.status, 201);
  const guestId = guestA.body.data.id;
  
  // UserB attempts to update UserA's guest
  const updateAttempt = await request(`/guests/${guestId}`, {
    method: "PUT",
    headers: authHeadersB,
    body: JSON.stringify({
      name: "Hacked Name",
      email: "hacked@test.com",
      confirmed: false
    }),
  });
  
  // UserB attempts to delete UserA's guest
  const deleteAttempt = await request(`/guests/${guestId}`, {
    method: "DELETE",
    headers: authHeadersB,
  });
  
  assert.equal(updateAttempt.status, 403, "UserB should get 403 when trying to update UserA's guest");
  assert.equal(deleteAttempt.status, 403, "UserB should get 403 when trying to delete UserA's guest");
  
  // Verify the guest was not modified
  const verifyGuest = await request(`/guests/${guestId}`, {
    method: "GET",
    headers: authHeadersA,
  });
  
  assert.equal(verifyGuest.status, 200);
  assert.equal(verifyGuest.body.data.name, "Guest for Ownership Test", "Guest name should not be modified");
});

test("Settings isolation - users have separate settings", async () => {
  // UserA sets a setting
  const settingA = await request("/settings/test_setting", {
    method: "PUT",
    headers: authHeadersA,
    body: JSON.stringify({ value: "userA_value" }),
  });
  
  // UserB sets the same setting to different value
  const settingB = await request("/settings/test_setting", {
    method: "PUT", 
    headers: authHeadersB,
    body: JSON.stringify({ value: "userB_value" }),
  });
  
  assert.equal(settingA.status, 200, "UserA should set setting successfully");
  assert.equal(settingB.status, 200, "UserB should set setting successfully");
  
  // Verify each user sees their own value
  const getSettingsA = await request("/settings", {
    method: "GET",
    headers: authHeadersA,
  });
  
  const getSettingsB = await request("/settings", {
    method: "GET", 
    headers: authHeadersB,
  });
  
  assert.equal(getSettingsA.status, 200);
  assert.equal(getSettingsB.status, 200);
  
  const testSettingA = getSettingsA.body.data.find(s => s.key === "test_setting");
  const testSettingB = getSettingsB.body.data.find(s => s.key === "test_setting");
  
  assert.equal(testSettingA?.value, "userA_value", "UserA should see their setting value");
  assert.equal(testSettingB?.value, "userB_value", "UserB should see their setting value");
});

test("Finances isolation - users cannot access other users' finances", async () => {
  // UserA creates a finance record
  const financeA = await request("/finances", {
    method: "POST",
    headers: authHeadersA,
    body: JSON.stringify({
      description: "UserA expense",
      amount: 100.50,
      type: "expense",
      category: "venue"
    }),
  });
  
  // UserB creates a finance record
  const financeB = await request("/finances", {
    method: "POST",
    headers: authHeadersB,
    body: JSON.stringify({
      description: "UserB expense", 
      amount: 200.75,
      type: "expense",
      category: "catering"
    }),
  });
  
  assert.equal(financeA.status, 201, "UserA should create finance successfully");
  assert.equal(financeB.status, 201, "UserB should create finance successfully");
  
  // Verify each user only sees their own finances
  const getFinancesA = await request("/finances", {
    method: "GET",
    headers: authHeadersA,
  });
  
  const getFinancesB = await request("/finances", {
    method: "GET",
    headers: authHeadersB,
  });
  
  assert.equal(getFinancesA.status, 200);
  assert.equal(getFinancesB.status, 200);
  
  assert.ok(getFinancesA.body.data.every(f => f.userId === userA.id), "UserA should only see their finances");
  assert.ok(getFinancesB.body.data.every(f => f.userId === userB.id), "UserB should only see their finances");
  
  // UserB attempts to delete UserA's finance - should fail
  const financeIdA = financeA.body.data.id;
  const deleteAttempt = await request(`/finances/${financeIdA}`, {
    method: "DELETE",
    headers: authHeadersB,
  });
  
  assert.equal(deleteAttempt.status, 403, "UserB should get 403 when trying to delete UserA's finance");
});

test("Public routes work with slug from URL", async () => {
  // UserA creates a guest first
  const guest = await request("/guests", {
    method: "POST",
    headers: authHeadersA,
    body: JSON.stringify({
      name: "Public Guest",
      email: "public@test.com",
      confirmed: true
    }),
  });
  
  assert.equal(guest.status, 201);
  const guestId = guest.body.data.id;
  
  // Access via public route (no authentication, slug from URL)
  const publicGuest = await request(`/guests/public/${userA.slug}/${guestId}`, {
    method: "GET"
    // No auth headers
  });
  
  assert.equal(publicGuest.status, 200, "Public route should work with slug from URL");
  assert.equal(publicGuest.body.data.id, guestId, "Should return the correct guest");
  assert.equal(publicGuest.body.data.name, "Public Guest", "Guest data should be correct");
  
  // Public route with wrong slug should not return the guest
  const wrongSlugAttempt = await request(`/guests/public/${userB.slug}/${guestId}`, {
    method: "GET"
  });
  
  assert.equal(wrongSlugAttempt.status, 404, "Public route with wrong slug should return 404");
});