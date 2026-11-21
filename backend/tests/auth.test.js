// Authentication module tests (M1). Run with: npm test
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestApp } from "./helpers.js";

let ctx;
const student = { name: "Test Student", email: "student@example.com", password: "secret123" };

before(async () => {
  ctx = await setupTestApp("auth");
});
after(async () => {
  await ctx.teardown();
});
beforeEach(async () => {
  await ctx.User.deleteMany({});
  const { resetLoginLimiter } = await import("../src/middleware/rateLimit.middleware.js");
  resetLoginLimiter();
});

const register = (body) => ctx.call("POST", "/auth/register", { body });
const login = (body) => ctx.call("POST", "/auth/login", { body });

test("registers a new student and returns a token", async () => {
  const res = await register(student);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, student.email);
  assert.equal(res.body.user.password, undefined, "password must never be returned");
});

test("stores the password as a bcrypt hash, not plain text", async () => {
  await register(student);
  const saved = await ctx.User.findOne({ email: student.email }).select("+password");
  assert.notEqual(saved.password, student.password);
  assert.match(saved.password, /^\$2[aby]\$/);
});

test("rejects a duplicate email (case-insensitive)", async () => {
  await register(student);
  const res = await register({ ...student, email: "STUDENT@example.com" });
  assert.equal(res.status, 409);
});

test("rejects invalid registration input", async () => {
  const res = await register({ name: "A", email: "not-an-email", password: "short" });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.name);
  assert.ok(res.body.errors.email);
  assert.ok(res.body.errors.password);
});

test("rejects a password without a number", async () => {
  const res = await register({ ...student, password: "onlyletters" });
  assert.equal(res.status, 400);
  assert.match(res.body.errors.password, /letter and one number/);
});

test("rejects a password longer than 72 bytes (bcrypt limit)", async () => {
  const res = await register({ ...student, password: "a1".repeat(37) }); // 74 characters
  assert.equal(res.status, 400);
  assert.match(res.body.errors.password, /at most 72/);
});

test("logs in with correct credentials", async () => {
  await register(student);
  const res = await login({ email: student.email, password: student.password });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test("rejects a wrong password", async () => {
  await register(student);
  const res = await login({ email: student.email, password: "wrongpass1" });
  assert.equal(res.status, 401);
  assert.equal(res.body.message, "Incorrect email or password");
});

test("rejects an unknown email with the same message", async () => {
  const res = await login({ email: "nobody@example.com", password: "secret123" });
  assert.equal(res.status, 401);
  assert.equal(res.body.message, "Incorrect email or password");
});

test("blocks login after 5 failed attempts (brute-force protection)", async () => {
  await register(student);
  for (let i = 0; i < 5; i++) {
    assert.equal((await login({ email: student.email, password: "wrongpass1" })).status, 401);
  }
  const blocked = await login({ email: student.email, password: student.password });
  assert.equal(blocked.status, 429, "even the correct password is blocked while locked");
  assert.match(blocked.body.message, /Too many failed login attempts/);
});

test("a successful login resets the failed-attempt counter", async () => {
  await register(student);
  for (let i = 0; i < 4; i++) await login({ email: student.email, password: "wrongpass1" });
  assert.equal((await login(student)).status, 200);
  for (let i = 0; i < 4; i++) await login({ email: student.email, password: "wrongpass1" });
  assert.equal((await login(student)).status, 200);
});

test("rejects login with missing fields", async () => {
  const res = await login({});
  assert.equal(res.status, 400);
});

test("returns the current user for a valid token", async () => {
  const { body } = await register(student);
  const res = await ctx.call("GET", "/auth/me", { token: body.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, student.name);
});

test("blocks protected routes without a token or with an invalid token", async () => {
  assert.equal((await ctx.call("GET", "/auth/me")).status, 401);
  assert.equal((await ctx.call("GET", "/auth/me", { token: "not.a.real.token" })).status, 401);
});

test("returns 400 for a request body that is not valid JSON", async () => {
  const res = await ctx.call("POST", "/auth/login", { raw: "{bad json" });
  assert.equal(res.status, 400);
});
