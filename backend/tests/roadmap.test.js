// Learning roadmap tests (M5 database layer): Create, Read, Update and Delete
// on the "roadmaps" collection, plus its links to users and career roles.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestApp } from "./helpers.js";

let ctx;
let token;
let role;

const register = async (email) =>
  (await ctx.call("POST", "/auth/register", { body: { name: "Roadmap Student", email, password: "secret123" } })).body.token;

before(async () => {
  ctx = await setupTestApp("roadmap");
});
after(async () => ctx.teardown());
beforeEach(async () => {
  await Promise.all([ctx.User.deleteMany({}), ctx.CareerRole.deleteMany({}), ctx.Roadmap.deleteMany({})]);
  role = await ctx.CareerRole.create({
    title: "Frontend Developer",
    requiredSkills: [
      { name: "HTML", level: "intermediate" },
      { name: "JavaScript", level: "intermediate" },
      { name: "React", level: "advanced" },
      { name: "Git", level: "basic" },
    ],
  });
  token = await register("roadmap@example.com");
  await ctx.call("PUT", "/profile", { token, body: { skills: ["HTML"] } });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
});

const create = () => ctx.call("POST", "/career/roadmap", { token });

test("roadmap routes require login", async () => {
  assert.equal((await ctx.call("POST", "/career/roadmap")).status, 401);
  assert.equal((await ctx.call("GET", "/career/roadmap")).status, 401);
  assert.equal((await ctx.call("DELETE", "/career/roadmap")).status, 401);
});

test("a roadmap needs a target role first", async () => {
  const other = await register("norole@example.com");
  const res = await ctx.call("POST", "/career/roadmap", { token: other });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Choose a career role/);
});

test("CREATE: builds one week per missing skill and saves it in MongoDB", async () => {
  const res = await create();
  assert.equal(res.status, 201);
  const { weeks, progress, role: savedRole } = res.body.roadmap;
  assert.deepEqual(weeks.map((w) => w.skill), ["JavaScript", "React", "Git"], "HTML is already known");
  assert.deepEqual(weeks.map((w) => w.tasks.length), [3, 4, 2], "more tasks for higher levels");
  assert.equal(savedRole.title, "Frontend Developer");
  assert.deepEqual(progress, { totalTasks: 9, doneTasks: 0, percentage: 0 });
  assert.equal(await ctx.Roadmap.countDocuments(), 1);
});

test("CREATE again replaces the old roadmap (one per student)", async () => {
  await create();
  await create();
  assert.equal(await ctx.Roadmap.countDocuments(), 1);
});

test("CREATE is refused when no skills are missing", async () => {
  await ctx.call("PUT", "/profile", { token, body: { skills: ["HTML", "JavaScript", "React", "Git"] } });
  const res = await create();
  assert.equal(res.status, 400);
  assert.equal(await ctx.Roadmap.countDocuments(), 0);
});

test("READ: returns the saved roadmap, or 404 before one exists", async () => {
  assert.equal((await ctx.call("GET", "/career/roadmap", { token })).status, 404);
  await create();
  const res = await ctx.call("GET", "/career/roadmap", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.roadmap.weeks.length, 3);
  assert.equal(res.body.outdated, false);
});

test("UPDATE: ticks a task, saves the time and updates progress", async () => {
  const created = await create();
  const taskId = created.body.roadmap.weeks[0].tasks[0]._id;

  const res = await ctx.call("PATCH", `/career/roadmap/tasks/${taskId}`, { token, body: { done: true } });
  assert.equal(res.status, 200);
  assert.equal(res.body.task.done, true);
  assert.ok(res.body.task.doneAt);
  assert.deepEqual(res.body.roadmap.progress, { totalTasks: 9, doneTasks: 1, percentage: 11 });

  const undo = await ctx.call("PATCH", `/career/roadmap/tasks/${taskId}`, { token, body: { done: false } });
  assert.equal(undo.body.task.doneAt, null);
  assert.equal(undo.body.roadmap.progress.doneTasks, 0);
});

test("UPDATE validates the body and the task id", async () => {
  const created = await create();
  const taskId = created.body.roadmap.weeks[0].tasks[0]._id;
  assert.equal((await ctx.call("PATCH", `/career/roadmap/tasks/${taskId}`, { token, body: { done: "yes" } })).status, 400);
  assert.equal((await ctx.call("PATCH", "/career/roadmap/tasks/not-an-id", { token, body: { done: true } })).status, 404);
  assert.equal((await ctx.call("PATCH", "/career/roadmap/tasks/000000000000000000000001", { token, body: { done: true } })).status, 404);
});

test("students cannot change each other's roadmap tasks", async () => {
  const created = await create();
  const taskId = created.body.roadmap.weeks[0].tasks[0]._id;
  const other = await register("other@example.com");
  const res = await ctx.call("PATCH", `/career/roadmap/tasks/${taskId}`, { token: other, body: { done: true } });
  assert.equal(res.status, 404);
  const saved = await ctx.Roadmap.findOne();
  assert.equal(saved.weeks[0].tasks[0].done, false);
});

test("a started roadmap skill shows as 'in progress' in the skill gap", async () => {
  const created = await create();
  const taskId = created.body.roadmap.weeks[0].tasks[0]._id; // JavaScript
  await ctx.call("PATCH", `/career/roadmap/tasks/${taskId}`, { token, body: { done: true } });

  const gap = await ctx.call("GET", "/career/skill-gap", { token });
  assert.equal(gap.body.skills.find((s) => s.name === "JavaScript").status, "in_progress");
  assert.deepEqual(gap.body.summary, { total: 4, done: 1, inProgress: 1, missing: 2, matchPercentage: 25 });
});

test("the roadmap is marked outdated after the target role changes", async () => {
  await create();
  const other = await ctx.CareerRole.create({ title: "Data Analyst", requiredSkills: [{ name: "SQL", level: "basic" }] });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: other.id } });
  const res = await ctx.call("GET", "/career/roadmap", { token });
  assert.equal(res.body.outdated, true);
});

test("DELETE: removes the roadmap; deleting twice returns 404", async () => {
  await create();
  const res = await ctx.call("DELETE", "/career/roadmap", { token });
  assert.equal(res.status, 200);
  assert.equal(await ctx.Roadmap.countDocuments(), 0);
  assert.equal((await ctx.call("DELETE", "/career/roadmap", { token })).status, 404);
});

test("the database refuses a second roadmap for the same student (unique index)", async () => {
  const user = await ctx.User.findOne({ email: "roadmap@example.com" });
  await ctx.Roadmap.create({ user: user._id, role: role._id, weeks: [] });
  await assert.rejects(ctx.Roadmap.create({ user: user._id, role: role._id, weeks: [] }), { code: 11000 });
});
