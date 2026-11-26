// Project recommendation tests (M7, FR-13).
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestApp } from "./helpers.js";

let ctx;
let token;
let role;

const register = async (email) =>
  (await ctx.call("POST", "/auth/register", { body: { name: "Rec Student", email, password: "secret123" } })).body.token;

before(async () => {
  ctx = await setupTestApp("recommendations");
});
after(async () => ctx.teardown());
beforeEach(async () => {
  await Promise.all([ctx.User.deleteMany({}), ctx.CareerRole.deleteMany({}), ctx.Project.deleteMany({})]);
  role = await ctx.CareerRole.create({
    title: "Backend Developer",
    requiredSkills: [
      { name: "JavaScript", level: "intermediate" },
      { name: "Node.js", level: "intermediate" },
      { name: "MongoDB", level: "intermediate" },
      { name: "Testing", level: "basic" },
    ],
  });
  await ctx.Project.create([
    { title: "Notes API", level: "intermediate", skills: ["Node.js", "MongoDB", "JavaScript"], description: "CRUD API" },
    { title: "Quiz Game", level: "beginner", skills: ["JavaScript", "Testing"], description: "Quiz with tests" },
    { title: "Portfolio", level: "beginner", skills: ["HTML", "CSS"], description: "Static site" },
    { title: "Sales Dashboard", level: "beginner", skills: ["Excel"], description: "Pivot tables" },
  ]);
  token = await register("rec@example.com");
  await ctx.call("PUT", "/profile", { token, body: { skills: ["JavaScript", "HTML"] } });
});

test("recommendations require login", async () => {
  const res = await ctx.call("GET", "/recommendations/projects");
  assert.equal(res.status, 401);
});

test("ranks projects that practise the student's missing skills first", async () => {
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
  const res = await ctx.call("GET", "/recommendations/projects", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.basedOn.targetRole, "Backend Developer");
  assert.deepEqual(res.body.basedOn.missingSkills, ["Node.js", "MongoDB", "Testing"]);

  const titles = res.body.recommendations.map((r) => r.project.title);
  // Projects without a missing skill (Portfolio, Sales Dashboard) are left out.
  assert.deepEqual(titles, ["Notes API", "Quiz Game"]);
  const first = res.body.recommendations[0];
  assert.deepEqual(first.match.practisesMissingSkills, ["Node.js", "MongoDB"]);
  assert.deepEqual(first.match.usesYourSkills, ["JavaScript"]);
  assert.equal(first.match.readyPercentage, 33);
  assert.ok(first.project.id);
  assert.equal(first.project._id, undefined);
});

test("without a career goal, projects that use the student's current skills are suggested", async () => {
  const res = await ctx.call("GET", "/recommendations/projects", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.basedOn.targetRole, null);
  const titles = res.body.recommendations.map((r) => r.project.title);
  assert.ok(titles.includes("Portfolio"));
  assert.ok(!titles.includes("Sales Dashboard"));
});

test("supports level and limit filters", async () => {
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
  const byLevel = await ctx.call("GET", "/recommendations/projects?level=beginner", { token });
  assert.deepEqual(byLevel.body.recommendations.map((r) => r.project.title), ["Quiz Game"]);

  const limited = await ctx.call("GET", "/recommendations/projects?limit=1", { token });
  assert.equal(limited.body.recommendations.length, 1);
  assert.equal(limited.body.total, 2);
});

test("rejects invalid query parameters with 400", async () => {
  for (const query of ["limit=0", "limit=abc", "limit=50", "level=expert"]) {
    const res = await ctx.call("GET", `/recommendations/projects?${query}`, { token });
    assert.equal(res.status, 400, query);
    assert.ok(res.body.errors.limit || res.body.errors.level, query);
  }
});

test("returns one project by id and 404 for unknown or invalid ids", async () => {
  const project = await ctx.Project.findOne({ title: "Notes API" });
  const ok = await ctx.call("GET", `/recommendations/projects/${project.id}`, { token });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.project.title, "Notes API");

  const missing = await ctx.call("GET", "/recommendations/projects/507f1f77bcf86cd799439011", { token });
  assert.equal(missing.status, 404);
  const invalid = await ctx.call("GET", "/recommendations/projects/not-an-id", { token });
  assert.equal(invalid.status, 404);
});

test("the database rejects a project without skills and duplicate titles", async () => {
  await assert.rejects(ctx.Project.create({ title: "Empty", description: "No skills", skills: [] }), /at least one skill/);
  await assert.rejects(ctx.Project.create({ title: "Notes API", description: "Again", skills: ["SQL"] }), { code: 11000 });
});

test("internship recommendations are still marked as not implemented", async () => {
  const res = await ctx.call("GET", "/recommendations/internships", { token });
  assert.equal(res.status, 501);
});
