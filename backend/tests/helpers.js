// Shared setup for API tests.
// Each test file gets its own database (e.g. skillsync_test_auth) because Node runs
// test files in parallel, and they must not delete each other's data.
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export async function setupTestApp(name) {
  process.env.JWT_SECRET = "test_secret_for_automated_tests_only";
  process.env.UPLOAD_DIR = path.join(os.tmpdir(), `skillsync-test-uploads-${name}-${process.pid}`);

  const base = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/skillsync_test";
  const uri = base.replace(/\/([^/?]+)(\?|$)/, `/$1_${name}$2`);

  const { default: app } = await import("../src/app.js");
  const { default: User } = await import("../src/models/User.js");
  const { default: CareerRole } = await import("../src/models/CareerRole.js");
  const { default: Roadmap } = await import("../src/models/Roadmap.js");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([User.init(), CareerRole.init(), Roadmap.init()]);

  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  async function call(method, urlPath, { body, token, raw, form } = {}) {
    const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
    if (!form) headers["Content-Type"] = "application/json";
    const res = await fetch(baseUrl + urlPath, {
      method,
      headers,
      body: form ?? raw ?? (body ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* not JSON (e.g. a file download) */ }
    return { status: res.status, body: json, text, headers: res.headers };
  }

  async function teardown() {
    server.close();
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
  }

  return { app, User, CareerRole, Roadmap, call, teardown };
}
