// Authentication module tests (T1.6).
// Run with: npm test
// Uses Node's built-in test runner and fetch, against a separate test database
// (TEST_MONGO_URI in .env). The test database is wiped before each test.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
process.env.JWT_SECRET = "test_secret_for_automated_tests_only";
const TEST_DB = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/skillsync_test";

const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");

let server;
let baseUrl;
const student = { name: "Test Student", email: "student@example.com", password: "secret123" };

before(async () => {
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 5000 });
  await User.init(); // build the unique email index
  server = app.listen(0); // random free port
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
beforeEach(async () => {
  await User.deleteMany({});
});

async function call(method, path, { body, token, raw } = {}) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  return { status: res.status, body: await res.json() };
}
const register = (body) => call("POST", "/auth/register", { body });
const login = (body) => call("POST", "/auth/login", { body });

test("registers a new student and returns a token", async () => {
  const res = await register(student);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, student.email);
  assert.equal(res.body.user.password, undefined, "password must never be returned");
});

test("stores the password as a bcrypt hash, not plain text", async () => {
  await register(student);
  const saved = await User.findOne({ email: student.email }).select("+password");
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

test("rejects login with missing fields", async () => {
  const res = await login({});
  assert.equal(res.status, 400);
});

test("returns the current user for a valid token", async () => {
  const { body } = await register(student);
  const res = await call("GET", "/auth/me", { token: body.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, student.name);
});

test("blocks protected routes without a token or with an invalid token", async () => {
  assert.equal((await call("GET", "/auth/me")).status, 401);
  assert.equal((await call("GET", "/auth/me", { token: "not.a.real.token" })).status, 401);
});

test("returns 400 for a request body that is not valid JSON", async () => {
  const res = await call("POST", "/auth/login", { raw: "{bad json" });
  assert.equal(res.status, 400);
});
