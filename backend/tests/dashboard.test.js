// Dashboard summary and health endpoint tests (M6, FR-12).
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { setupTestApp } from "./helpers.js";

let ctx;
let token;
let role;

before(async () => {
  ctx = await setupTestApp("dashboard");
});
after(async () => ctx.teardown());
beforeEach(async () => {
  await Promise.all([ctx.User.deleteMany({}), ctx.CareerRole.deleteMany({}), ctx.Roadmap.deleteMany({})]);
  role = await ctx.CareerRole.create({
    title: "Frontend Developer",
    requiredSkills: [
      { name: "HTML", level: "basic" },
      { name: "JavaScript", level: "intermediate" },
      { name: "React", level: "intermediate" },
      { name: "Git", level: "basic" },
    ],
  });
  const res = await ctx.call("POST", "/auth/register", {
    body: { name: "Dash Student", email: "dash@example.com", password: "secret123" },
  });
  token = res.body.token;
});

test("dashboard requires login", async () => {
  assert.equal((await ctx.call("GET", "/dashboard")).status, 401);
});

test("a new student sees an empty dashboard with only the first step done", async () => {
  const res = await ctx.call("GET", "/dashboard", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.careerReadiness.targetRole, null);
  assert.equal(res.body.careerReadiness.matchPercentage, null);
  assert.equal(res.body.roadmap, null);
  assert.equal(res.body.profile.skillsCount, 0);
  assert.deepEqual(res.body.checklistProgress, { done: 1, total: 5, percentage: 20 });
});

test("shows readiness, the current roadmap week and the next task", async () => {
  await ctx.call("PUT", "/profile", { token, body: { university: "UET", degree: "BSCS", skills: ["HTML", "Git"] } });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
  const created = await ctx.call("POST", "/career/roadmap", { token });
  const firstWeek = created.body.roadmap.weeks[0];

  let res = await ctx.call("GET", "/dashboard", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.careerReadiness.targetRole.title, "Frontend Developer");
  assert.equal(res.body.careerReadiness.matchPercentage, 50);
  assert.equal(res.body.roadmap.currentWeek.week, 1);
  assert.equal(res.body.roadmap.currentWeek.skill, "JavaScript");
  assert.equal(res.body.roadmap.currentWeek.nextTask.id, firstWeek.tasks[0]._id);
  assert.equal(res.body.roadmap.outdated, false);
  assert.deepEqual(res.body.checklistProgress, { done: 4, total: 5, percentage: 80 });

  // Finish every task of week 1: the current week moves to week 2 and JavaScript is "in progress".
  for (const task of firstWeek.tasks) {
    await ctx.call("PATCH", `/career/roadmap/tasks/${task._id}`, { token, body: { done: true } });
  }
  res = await ctx.call("GET", "/dashboard", { token });
  assert.equal(res.body.roadmap.currentWeek.week, 2);
  assert.equal(res.body.roadmap.currentWeek.skill, "React");
  assert.equal(res.body.careerReadiness.summary.inProgress, 1);
});

test("marks the roadmap as outdated after the career goal changes", async () => {
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
  await ctx.call("POST", "/career/roadmap", { token });
  const other = await ctx.CareerRole.create({ title: "Data Analyst", requiredSkills: [{ name: "SQL", level: "basic" }] });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: other.id } });

  const res = await ctx.call("GET", "/dashboard", { token });
  assert.equal(res.body.roadmap.outdated, true);
  assert.equal(res.body.careerReadiness.summary.inProgress, 0);
});

test("health reports the database and AI service status", async () => {
  const fakeAI = http.createServer((req, res) => res.end('{"status":"ok"}'));
  await new Promise((resolve) => fakeAI.listen(0, resolve));
  const previous = process.env.AI_SERVICE_URL;
  try {
    process.env.AI_SERVICE_URL = `http://127.0.0.1:${fakeAI.address().port}`;
    let res = await ctx.call("GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.database, "connected");
    assert.equal(res.body.aiService, "connected");

    await new Promise((resolve) => fakeAI.close(resolve));
    res = await ctx.call("GET", "/health");
    assert.equal(res.status, 200); // the API still answers when the AI service is down
    assert.equal(res.body.aiService, "not reachable");
  } finally {
    if (previous === undefined) delete process.env.AI_SERVICE_URL;
    else process.env.AI_SERVICE_URL = previous;
    if (fakeAI.listening) fakeAI.close();
  }
});

test("unknown routes return a JSON 404 and invalid JSON returns 400", async () => {
  const notFound = await ctx.call("GET", "/does-not-exist");
  assert.equal(notFound.status, 404);
  assert.match(notFound.body.message, /Route not found/);

  const badJson = await ctx.call("POST", "/auth/login", { raw: "{not json" });
  assert.equal(badJson.status, 400);
  assert.equal(badJson.body.message, "Request body must be valid JSON");
});
