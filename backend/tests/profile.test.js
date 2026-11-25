// Profile & Resume module tests (M2), including the connection to the AI service (M3).
// A small fake AI service is started so the tests do not depend on Python running.
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import { setupTestApp } from "./helpers.js";

let ctx;
let fakeAI;
let aiMode = "ok"; // "ok" | "down"
let token;

const PDF = Buffer.from("%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

function pdfForm(buffer = PDF, name = "my-resume.pdf", type = "application/pdf") {
  const form = new FormData();
  form.append("resume", new Blob([buffer], { type }), name);
  return form;
}

before(async () => {
  // Fake Python AI service:
  //  - /resume/analyze always "detects" the same skills
  //  - /skills/normalize knows two spellings and removes duplicates, like the real one
  const STANDARD = { nextjs: "Next.js", javascript: "JavaScript" };
  fakeAI = http.createServer((req, res) => {
    if (aiMode === "down") {
      res.writeHead(500).end();
      return;
    }
    let raw = "";
    req.on("data", (chunk) => { if (req.url === "/skills/normalize") raw += chunk; });
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json" });
      if (req.url === "/skills/normalize") {
        const out = [];
        for (const s of JSON.parse(raw).skills) {
          const name = STANDARD[s.toLowerCase().replace(/[^a-z0-9+#]/g, "")] || s;
          if (!out.some((o) => o.toLowerCase() === name.toLowerCase())) out.push(name);
        }
        return res.end(JSON.stringify({ skills: out }));
      }
      res.end(JSON.stringify({ skills: ["Python", "React", "MongoDB"], word_count: 120 }));
    });
  }).listen(0);
  process.env.AI_SERVICE_URL = `http://127.0.0.1:${fakeAI.address().port}`;
  ctx = await setupTestApp("profile");
});
after(async () => {
  fakeAI.close();
  await ctx.teardown();
});
beforeEach(async () => {
  aiMode = "ok";
  await ctx.User.deleteMany({});
  const res = await ctx.call("POST", "/auth/register", {
    body: { name: "Profile Student", email: "profile@example.com", password: "secret123" },
  });
  token = res.body.token;
});

const updateProfile = (body) => ctx.call("PUT", "/profile", { token, body });
const upload = (form) => ctx.call("POST", "/profile/resume", { token, form });

// ---------- Integration with authentication (M1)

test("profile routes require login", async () => {
  assert.equal((await ctx.call("GET", "/profile")).status, 401);
  assert.equal((await ctx.call("PUT", "/profile", { body: { university: "X" } })).status, 401);
  assert.equal((await ctx.call("POST", "/profile/resume", { form: pdfForm() })).status, 401);
});

test("a new student starts with an empty, incomplete profile", async () => {
  const res = await ctx.call("GET", "/profile", { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.profileComplete, false);
  assert.deepEqual(res.body.user.skills, []);
  assert.equal(res.body.user.resume, null);
});

// ---------- Profile update (FR-04, FR-05)

test("updates education details and marks the profile complete", async () => {
  const res = await updateProfile({ university: " FAST University ", degree: "BS Computer Science", graduationYear: 2027 });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.university, "FAST University", "values are trimmed");
  assert.equal(res.body.user.graduationYear, 2027);
  assert.equal(res.body.user.profileComplete, true);
});

test("saves skills without duplicates (case-insensitive) and trims them", async () => {
  const res = await updateProfile({ skills: ["React", " react ", "Node.js", "", "  MongoDB  "] });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.user.skills, ["React", "Node.js", "MongoDB"]);
});

test("typed skills are converted to standard names by the AI service (no 'Nextjs' + 'Next.js')", async () => {
  const res = await updateProfile({ skills: ["Nextjs", "Next.js", "javascript", "Nest.js"] });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.user.skills, ["Next.js", "JavaScript", "Nest.js"]);
});

test("skills are still saved (as typed) when the AI service is down", async () => {
  aiMode = "down";
  const res = await updateProfile({ skills: ["Nextjs", "React"] });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.user.skills, ["Nextjs", "React"]);
});

test("a partial update does not erase other fields", async () => {
  await updateProfile({ university: "FAST", skills: ["Python"] });
  const res = await updateProfile({ degree: "BSCS" });
  assert.equal(res.body.user.university, "FAST");
  assert.deepEqual(res.body.user.skills, ["Python"]);
});

test("rejects invalid profile data", async () => {
  const res = await updateProfile({ graduationYear: 1900, skills: "not-a-list", name: "A" });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.graduationYear);
  assert.ok(res.body.errors.skills);
  assert.ok(res.body.errors.name);
});

test("rejects more than 50 skills", async () => {
  const skills = Array.from({ length: 51 }, (_, i) => `Skill ${i}`);
  assert.equal((await updateProfile({ skills })).status, 400);
});

test("ignores fields that cannot be changed through the profile (e.g. email, password)", async () => {
  await updateProfile({ email: "hacker@example.com", password: "changed123" });
  const me = await ctx.call("GET", "/profile", { token });
  assert.equal(me.body.user.email, "profile@example.com");
  const login = await ctx.call("POST", "/auth/login", { body: { email: "profile@example.com", password: "secret123" } });
  assert.equal(login.status, 200, "old password still works");
});

// ---------- Resume upload + AI analysis (FR-06, FR-07)

test("uploads a PDF and returns skills detected by the AI service", async () => {
  await updateProfile({ skills: ["React"] });
  const res = await upload(pdfForm());
  assert.equal(res.status, 201);
  assert.equal(res.body.analysis, "completed");
  assert.deepEqual(res.body.detectedSkills, ["Python", "React", "MongoDB"]);
  assert.deepEqual(res.body.newSkills, ["Python", "MongoDB"], "skills the student already has are not suggested again");
  assert.equal(res.body.user.resume.originalName, "my-resume.pdf");
  assert.equal(res.body.user.resume.fileName, undefined, "internal file name is hidden");
  assert.deepEqual(res.body.user.skills, ["React"], "detected skills are not added until the student confirms");
});

test("still saves the resume when the AI service is down", async () => {
  aiMode = "down";
  const res = await upload(pdfForm());
  assert.equal(res.status, 201);
  assert.equal(res.body.analysis, "unavailable");
  assert.deepEqual(res.body.detectedSkills, []);
  assert.ok(res.body.user.resume);
});

test("rejects a file that is not a PDF", async () => {
  const res = await upload(pdfForm(Buffer.from("hello"), "notes.txt", "text/plain"));
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Only PDF/);
});

test("rejects a fake PDF (correct name, wrong content)", async () => {
  const res = await upload(pdfForm(Buffer.from("MZ this is really an exe"), "resume.pdf"));
  assert.equal(res.status, 400);
  assert.match(res.body.message, /not a valid PDF/);
});

test("rejects a PDF larger than 2 MB", async () => {
  const big = Buffer.concat([PDF, Buffer.alloc(2 * 1024 * 1024)]);
  const res = await upload(pdfForm(big));
  assert.equal(res.status, 413);
});

test("rejects an upload without a file", async () => {
  const res = await upload(new FormData());
  assert.equal(res.status, 400);
});

test("downloads and deletes your own resume", async () => {
  await upload(pdfForm());
  const download = await ctx.call("GET", "/profile/resume", { token });
  assert.equal(download.status, 200);
  assert.ok(download.text.startsWith("%PDF-"));

  const del = await ctx.call("DELETE", "/profile/resume", { token });
  assert.equal(del.status, 200);
  assert.equal(del.body.user.resume, null);
  assert.equal((await ctx.call("GET", "/profile/resume", { token })).status, 404);
});

test("students cannot see each other's resumes", async () => {
  await upload(pdfForm());
  const other = await ctx.call("POST", "/auth/register", {
    body: { name: "Other Student", email: "other@example.com", password: "secret123" },
  });
  const res = await ctx.call("GET", "/profile/resume", { token: other.body.token });
  assert.equal(res.status, 404, "the other student only ever gets their own (empty) resume");
});

test("account deletion needs the correct password", async () => {
  assert.equal((await ctx.call("DELETE", "/profile", { token, body: {} })).status, 400);
  const wrong = await ctx.call("DELETE", "/profile", { token, body: { password: "wrong-password" } });
  assert.equal(wrong.status, 400);
  assert.equal(await ctx.User.countDocuments(), 1, "nothing is deleted with a wrong password");
});

test("deleting the account removes the user, the resume file and the roadmap", async () => {
  await upload(pdfForm());
  const user = await ctx.User.findOne({ email: "profile@example.com" });
  const filePath = path.join(process.env.UPLOAD_DIR, user.resume.fileName);
  await fs.access(filePath); // the file exists before deletion
  await ctx.Roadmap.create({ user: user._id, role: new mongoose.Types.ObjectId(), weeks: [] });

  const res = await ctx.call("DELETE", "/profile", { token, body: { password: "secret123" } });
  assert.equal(res.status, 200);
  assert.equal(await ctx.User.countDocuments(), 0);
  assert.equal(await ctx.Roadmap.countDocuments(), 0);
  await assert.rejects(fs.access(filePath), "the resume file is removed from disk");
  assert.equal((await ctx.call("GET", "/profile", { token })).status, 401, "the old token no longer works");
});
