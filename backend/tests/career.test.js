// Career role selection and skill-gap analysis tests (M4).
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestApp } from "./helpers.js";

let ctx;
let token;
let role;

before(async () => {
  ctx = await setupTestApp("career");
});
after(async () => ctx.teardown());
beforeEach(async () => {
  await Promise.all([ctx.User.deleteMany({}), ctx.CareerRole.deleteMany({})]);
  role = await ctx.CareerRole.create({
    title: "Frontend Developer",
    description: "Build modern web interfaces.",
    requiredSkills: [
      { name: "HTML", level: "intermediate" },
      { name: "JavaScript", level: "intermediate" },
      { name: "React", level: "intermediate" },
      { name: "Testing", level: "basic" },
    ],
  });
  const registered = await ctx.call("POST", "/auth/register", {
    body: { name: "Career Student", email: "career@example.com", password: "secret123" },
  });
  token = registered.body.token;
});

test("lists available career roles without requiring login", async () => {
  const res = await ctx.call("GET", "/career/roles");
  assert.equal(res.status, 200);
  assert.equal(res.body.roles.length, 1);
  assert.equal(res.body.roles[0].title, "Frontend Developer");
  assert.equal(res.body.roles[0].id, role.id);
});

test("target-role selection requires login", async () => {
  const res = await ctx.call("PUT", "/career/target-role", { body: { roleId: role.id } });
  assert.equal(res.status, 401);
});

test("rejects a missing or malformed role id", async () => {
  assert.equal((await ctx.call("PUT", "/career/target-role", { token, body: {} })).status, 400);
  assert.equal((await ctx.call("PUT", "/career/target-role", { token, body: { roleId: "wrong" } })).status, 400);
});

test("returns 404 when a valid role id does not exist", async () => {
  const missingId = "000000000000000000000001";
  const res = await ctx.call("PUT", "/career/target-role", { token, body: { roleId: missingId } });
  assert.equal(res.status, 404);
});

test("saves the selected target role on the student", async () => {
  const res = await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.targetRole, role.id);
  assert.equal(res.body.role.title, "Frontend Developer");
});

test("skill-gap analysis requires login", async () => {
  assert.equal((await ctx.call("GET", "/career/skill-gap")).status, 401);
});

test("asks the student to choose a role before calculating a gap", async () => {
  const res = await ctx.call("GET", "/career/skill-gap", { token });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Choose a career role/);
});

test("calculates matched and missing skills case-insensitively", async () => {
  await ctx.call("PUT", "/profile", { token, body: { skills: ["html", "React"] } });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: role.id } });

  const res = await ctx.call("GET", "/career/skill-gap", { token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.summary, {
    total: 4, done: 2, inProgress: 0, missing: 2, matchPercentage: 50,
  });
  assert.equal(res.body.skills.find((skill) => skill.name === "HTML").status, "done");
  assert.equal(res.body.skills.find((skill) => skill.name === "JavaScript").status, "missing");
});

test("returns zero percent safely for a role with no requirements", async () => {
  const empty = await ctx.CareerRole.create({ title: "Explorer", requiredSkills: [] });
  await ctx.call("PUT", "/career/target-role", { token, body: { roleId: empty.id } });
  const res = await ctx.call("GET", "/career/skill-gap", { token });
  assert.equal(res.body.summary.matchPercentage, 0);
  assert.equal(res.body.summary.total, 0);
});
