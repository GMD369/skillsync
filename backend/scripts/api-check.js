// End-to-end check of every SkillSync API endpoint against a RUNNING server.
// It creates a temporary student, calls each endpoint (valid and invalid requests),
// compares the status code with the expected one, and deletes the student at the end.
// Usage: npm start (in another terminal), then: npm run api:check
// Optional: API_URL=http://localhost:5000/api npm run api:check
const API = process.env.API_URL || "http://localhost:5000/api";
const email = `api-check-${Date.now()}@example.com`;
const password = "check-pass-123";
const results = [];
let token;

async function call(method, path, { body, auth = true, raw, form, expect, note }) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (!form) headers["Content-Type"] = "application/json";
  const start = performance.now();
  const res = await fetch(API + path, { method, headers, body: form ?? raw ?? (body && JSON.stringify(body)) });
  const ms = performance.now() - start;
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* file download */ }
  const ok = res.status === expect;
  results.push({ ok });
  const summary = typeof note === "function" ? note(data, res) : note || data.message || "";
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${method.padEnd(6)} ${path.padEnd(52)} ${String(res.status).padEnd(4)}` +
    `${ok ? "" : `(expected ${expect}) `}${String(Math.round(ms)).padStart(4)} ms  ${String(summary).slice(0, 70)}`
  );
  return data;
}

// A tiny but valid one-page PDF with some text, so the resume upload can be tested end to end.
function samplePdf(text) {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

const fileForm = (buffer, name, type) => {
  const form = new FormData();
  form.append("resume", new Blob([buffer], { type }), name);
  return form;
};

const section = (title) => console.log(`\n== ${title}`);

try {
  console.log(`SkillSync API check against ${API}`);
  section("System");
  await call("GET", "/health", { auth: false, expect: 200, note: (d) => `database ${d.database}, AI service ${d.aiService}` });
  await call("GET", "/unknown-route", { auth: false, expect: 404 });

  section("Authentication (M1)");
  await call("POST", "/auth/register", { auth: false, body: { name: "A", email: "bad", password: "123" }, expect: 400,
    note: (d) => `invalid input: ${Object.keys(d.errors || {}).join(", ")}` });
  const reg = await call("POST", "/auth/register", { auth: false, body: { name: "API Check Student", email, password }, expect: 201,
    note: (d) => `created user, token ${d.token ? "received" : "missing"}` });
  token = reg.token;
  await call("POST", "/auth/register", { auth: false, body: { name: "API Check Student", email, password }, expect: 409 });
  await call("POST", "/auth/login", { auth: false, body: { email, password: "wrong-pass-1" }, expect: 401 });
  await call("POST", "/auth/login", { auth: false, raw: "{not json", expect: 400 });
  await call("POST", "/auth/login", { auth: false, body: { email, password }, expect: 200, note: "logged in, JWT returned" });
  await call("GET", "/auth/me", { expect: 200, note: (d) => `current user: ${d.user?.name}` });
  const saved = token;
  token = "not-a-valid-token";
  await call("GET", "/auth/me", { expect: 401 });
  token = saved;

  section("Profile & resume (M2, M3)");
  await call("GET", "/profile", { expect: 200, note: (d) => `profileComplete = ${d.user?.profileComplete}` });
  await call("PUT", "/profile", { body: { graduationYear: 1900 }, expect: 400, note: (d) => d.errors?.graduationYear });
  await call("PUT", "/profile", {
    body: { university: "Demo University", degree: "BS Computer Science", graduationYear: 2027, skills: ["html", "CSS", "javascript", "Nodejs", "Git"] },
    expect: 200, note: (d) => `skills normalized: ${d.user?.skills.join(", ")}`,
  });
  await call("GET", "/profile/resume", { expect: 404 });
  await call("POST", "/profile/resume", { form: fileForm(Buffer.from("hello"), "notes.txt", "text/plain"), expect: 400 });
  await call("POST", "/profile/resume", {
    form: fileForm(samplePdf("Skills: React, MongoDB, Express, Python"), "resume.pdf", "application/pdf"),
    expect: 201, note: (d) => `AI service detected: ${d.user?.resume?.detectedSkills.join(", ")}`,
  });
  await call("GET", "/profile/resume", { expect: 200, note: (d, res) => `file download (${res.headers.get("content-type")})` });

  section("Career & skill gap (M4)");
  const { roles = [] } = await call("GET", "/career/roles", { auth: false, expect: 200, note: (d) => `${d.roles?.length} roles` });
  await call("GET", "/career/skill-gap", { expect: 400 });
  await call("PUT", "/career/target-role", { body: { roleId: "123" }, expect: 400 });
  await call("PUT", "/career/target-role", { body: { roleId: "507f1f77bcf86cd799439011" }, expect: 404 });
  const role = roles.find((r) => r.title === "Full-Stack Developer") || roles[0];
  await call("PUT", "/career/target-role", { body: { roleId: role?.id }, expect: 200 });
  await call("GET", "/career/skill-gap", { expect: 200,
    note: (d) => `match ${d.summary?.matchPercentage}%, missing: ${d.skills?.filter((s) => s.status === "missing").map((s) => s.name).join(", ")}` });

  section("Learning roadmap (M5)");
  await call("GET", "/career/roadmap", { expect: 404 });
  const created = await call("POST", "/career/roadmap", { expect: 201 });
  const task = created.roadmap?.weeks[0]?.tasks[0];
  await call("GET", "/career/roadmap", { expect: 200, note: (d) => `${d.roadmap?.weeks.length} weeks, ${d.roadmap?.progress.totalTasks} tasks` });
  await call("PATCH", `/career/roadmap/tasks/${task?._id}`, { body: { done: "yes" }, expect: 400 });
  await call("PATCH", "/career/roadmap/tasks/507f1f77bcf86cd799439011", { body: { done: true }, expect: 404 });
  await call("PATCH", `/career/roadmap/tasks/${task?._id}`, { body: { done: true }, expect: 200,
    note: (d) => `progress ${d.roadmap?.progress.percentage}%` });

  section("Dashboard (M6) and recommendations (M7)");
  await call("GET", "/dashboard", { expect: 200,
    note: (d) => `readiness ${d.careerReadiness?.matchPercentage}%, week ${d.roadmap?.currentWeek?.week} (${d.roadmap?.currentWeek?.skill}), checklist ${d.checklistProgress?.percentage}%` });
  const recs = await call("GET", "/recommendations/projects?limit=3", { expect: 200,
    note: (d) => `top: ${d.recommendations?.map((r) => r.project.title).join("; ")}` });
  await call("GET", "/recommendations/projects?level=expert", { expect: 400 });
  await call("GET", `/recommendations/projects/${recs.recommendations?.[0]?.project.id}`, { expect: 200, note: (d) => d.project?.title });
  await call("GET", "/recommendations/projects/507f1f77bcf86cd799439011", { expect: 404 });
  await call("GET", "/interview/questions", { expect: 501 });

  section("Delete (clean up)");
  await call("DELETE", "/career/roadmap", { expect: 200 });
  await call("DELETE", "/career/roadmap", { expect: 404 });
  await call("DELETE", "/profile/resume", { expect: 200 });
  await call("DELETE", "/profile", { body: { password: "wrong-pass-1" }, expect: 400 });
  await call("DELETE", "/profile", { body: { password }, expect: 200 });
  await call("GET", "/auth/me", { expect: 401, note: "account is gone, token no longer works" });
} catch (err) {
  console.error(`\nCould not finish: ${err.message}. Is the backend running on ${API}?`);
  results.push({ ok: false });
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed} of ${results.length} checks passed.`);
process.exitCode = passed === results.length ? 0 : 1;
