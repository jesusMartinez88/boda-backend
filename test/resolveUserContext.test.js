import { describe, it, beforeEach, before } from "node:test";
import assert from "node:assert";
import { resolveUserContext } from "../src/middleware/resolveUserContext.js";
import { createUser } from "../src/models/user.js";
import db, { initializationPromise } from "../src/db.js";

describe("resolveUserContext middleware", () => {
  let req, res, nextCalled, nextError, testUser;

  before(async () => {
    await initializationPromise;
    // Create a test user in DB
    testUser = await db.get(
      "SELECT id, username, slug FROM users WHERE slug = ?",
      ["test-user"],
    );
    if (!testUser) {
      testUser = await createUser({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        slug: "test-user",
      });
    }
  });

  beforeEach(() => {
    req = {
      params: {},
      user: {},
    };
    res = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.body = data;
        return this;
      },
    };
    nextCalled = false;
    nextError = null;
  });

  it("should extract slug from URL params (public route)", async () => {
    req.params.userSlug = "test-user";

    await resolveUserContext(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true, "next() should be called");
    assert.strictEqual(
      nextError,
      undefined,
      "no error should be passed to next()",
    );
    assert.ok(req.userContext, "userContext should be mounted");
    assert.strictEqual(req.userContext.slug, "test-user", "slug should match");
    assert.ok(req.userContext.userId, "userId should be set");
  });

  it("should extract slug from token (private route)", async () => {
    req.user = { userId: testUser.id, username: "testuser", slug: "test-user" };

    await resolveUserContext(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(nextCalled, true, "next() should be called");
    assert.strictEqual(
      nextError,
      undefined,
      "no error should be passed to next()",
    );
    assert.ok(req.userContext, "userContext should be mounted");
    assert.strictEqual(req.userContext.slug, "test-user", "slug should match");
  });

  it("should return 400 if no slug found", async () => {
    // No params.userSlug, no user.slug
    await resolveUserContext(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(res.statusCode, 400, "should return 400");
    assert.strictEqual(res.body.success, false, "success should be false");
    assert.strictEqual(
      res.body.message,
      "User context required",
      "should return correct error message",
    );
  });

  it("should return 404 if user not found", async () => {
    req.params.userSlug = "nonexistent-user";

    await resolveUserContext(req, res, (err) => {
      nextCalled = true;
      nextError = err;
    });

    assert.strictEqual(res.statusCode, 404, "should return 404");
    assert.strictEqual(res.body.success, false, "success should be false");
    assert.strictEqual(
      res.body.message,
      "User not found",
      "should return correct error message",
    );
  });
});
