// End-to-end test of the complete SkillSync workflow in a real browser:
// frontend (Next.js) -> backend (Express) -> MongoDB, plus the AI service for the resume.
//
// It creates a new test student through the UI, goes through every main page, checks what the
// page shows AND what the backend stored, simulates failed API requests, and finally deletes the
// test account through the UI, so no test data is left behind.
//
// Usage (backend, AI service and frontend must be running):
//   npm run test:e2e                         # headless
//   SHOTS=e2e/output npm run test:e2e        # also save a screenshot of every step
//   APP_URL=http://localhost:3000 API_URL=http://localhost:5000/api   (defaults)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { launchBrowser } from "./cdp.mjs";

const APP = process.env.APP_URL || "http://localhost:3000";
const API = process.env.API_URL || "http://localhost:5000/api";
const SHOTS = process.env.SHOTS;
const student = {
  name: "E2E Test Student",
  email: `e2e-${Date.now()}@example.com`,
  password: "e2e-pass-123",
};

const results = [];
let page;
let shotNo = 0;

async function step(title, fn) {
  const start = Date.now();
  try {
    await fn();
    results.push(true);
    console.log(`PASS  ${title} (${Date.now() - start} ms)`);
  } catch (err) {
    results.push(false);
    console.log(`FAIL  ${title}\n      ${err.message}`);
    if (SHOTS) await page.screenshot(path.join(SHOTS, `FAILED-${String(++shotNo).padStart(2, "0")}.png`)).catch(() => {});
    throw err; // later steps depend on this one
  }
}

const check = (condition, message) => { if (!condition) throw new Error(message); };
const shot = async (name) => SHOTS && page.screenshot(path.join(SHOTS, `${String(++shotNo).padStart(2, "0")}_${name}.png`));
const apiCount = (method, end) => page.requests.filter((r) => r.method === method && r.url.split("?")[0].endsWith(end)).length;

// Reads data straight from the backend with the token the frontend saved, to prove that
// what the page shows was really stored in the database.
const fromBackend = (urlPath) => page.eval(`fetch(${JSON.stringify(API + urlPath)}, {
  headers: { Authorization: "Bearer " + localStorage.getItem("skillsync_token") } }).then((r) => r.json())`);

// A small one-page PDF with some skills in it, so the resume upload and AI analysis can be tested
// without a personal resume.
function writeSamplePdf(file) {
  const stream = "BT /F1 12 Tf 72 720 Td (Skills: JavaScript, React, Node.js, Express, MongoDB, Git) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((obj, i) => { const at = pdf.length; pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; return at; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(file, pdf, "latin1");
}

const pdfFile = path.join(os.tmpdir(), `skillsync-e2e-resume-${Date.now()}.pdf`);
writeSamplePdf(pdfFile);
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const browser = await launchBrowser();
page = browser.page;
let accountCreated = false;
console.log(`SkillSync end-to-end workflow test\nfrontend ${APP}  |  backend ${API}  |  test student ${student.email}\n`);

try {
  // ---------------------------------------------------------------- 1. Registration workflow
  await step("Register: empty form shows validation errors and sends no request", async () => {
    await page.goto(`${APP}/register`);
    await page.click("text=Create account");
    await page.waitForText("Name must be at least 2 characters");
    check(await page.hasText("Please enter a valid email address"), "email error missing");
    check(apiCount("POST", "/auth/register") === 0, "a request was sent for an invalid form");
    await shot("register_validation");
  });

  await step("Register: a double-click sends only ONE request; account is stored and the dashboard opens", async () => {
    await page.type("#name", student.name);
    await page.type("#email", student.email);
    await page.type("#password", student.password);
    await page.type("#confirmPassword", student.password);
    await shot("register_filled");
    await page.click("text=Create account", { times: 2 });
    await page.waitFor("location.pathname === '/dashboard'");
    accountCreated = true;
    await page.waitForText("Welcome, E2E!");
    check(apiCount("POST", "/auth/register") === 1, `expected 1 register request, got ${apiCount("POST", "/auth/register")}`);
    const me = await fromBackend("/auth/me");
    check(me.user?.email === student.email, "the backend does not return the new account");
    await page.waitForText("1 of 5 done");
    await shot("dashboard_new_student");
  });

  // ---------------------------------------------------------------- 2. Profile and resume
  await step("Profile: education details are saved to the database", async () => {
    await page.click("text=Profile");
    await page.waitFor("location.pathname === '/profile'");
    await page.type("#university", "Demo University");
    await page.type("#degree", "BS Computer Science");
    await page.type("#graduationYear", "2027");
    await page.click("text=Save profile");
    await page.waitForText("Profile saved.");
    const { user } = await fromBackend("/profile");
    check(user.university === "Demo University" && user.graduationYear === 2027, "profile not stored");
    check(user.profileComplete === true, "profile not marked complete");
  });

  await step("Profile: typed skills are saved and normalized by the AI service (\"nodejs\" -> \"Node.js\")", async () => {
    for (const skill of ["html", "CSS", "nodejs"]) {
      await page.type("#skills", skill);
      await page.press("Enter");
    }
    await page.click("text=Save skills");
    await page.waitForText("Skills saved (3).");
    const { user } = await fromBackend("/profile");
    check(JSON.stringify(user.skills) === JSON.stringify(["HTML", "CSS", "Node.js"]), `skills stored as ${user.skills}`);
  });

  await step("Resume: a non-PDF file is rejected in the browser before upload", async () => {
    const txt = pdfFile.replace(".pdf", ".txt");
    fs.writeFileSync(txt, "not a pdf");
    const before = apiCount("POST", "/profile/resume");
    await page.setFile("#resume-file", txt);
    await page.waitForText("Only PDF files are allowed");
    check(apiCount("POST", "/profile/resume") === before, "an invalid file was sent to the server");
    fs.rmSync(txt, { force: true });
  });

  await step("Resume: PDF upload -> backend -> AI service detects skills -> student adds them", async () => {
    await page.setFile("#resume-file", pdfFile);
    await page.waitForText("New skills found in your resume", 30000);
    await shot("profile_resume_detected");
    await page.click("text=to my profile");
    await page.waitForText("added to your profile");
    const { user } = await fromBackend("/profile");
    check(user.resume?.detectedSkills.includes("React"), "detected skills not stored");
    check(user.skills.includes("React") && user.skills.includes("MongoDB"), "selected skills not added");
  });

  // ---------------------------------------------------------------- 3. Career goal and skill gap
  await step("Skill gap: choose Full-Stack Developer and see the report", async () => {
    await page.click("text=Skill Gap");
    await page.waitForText("Choose your career goal");
    await page.click("text=Full-Stack Developer");
    await page.click("text=Save goal & analyze skills");
    await page.waitForText("Your skill-gap report");
    const gap = await fromBackend("/career/skill-gap");
    check(gap.role.title === "Full-Stack Developer", "target role not stored");
    check(await page.hasText(`${gap.summary.matchPercentage}%`), "page and backend show different percentages");
    await shot("skill_gap_report");
  });

  // ---------------------------------------------------------------- 4. Roadmap (create + update)
  await step("Roadmap: create a roadmap and tick a task; progress is saved", async () => {
    await page.click("text=Roadmap");
    await page.waitForText("No roadmap yet");
    await page.click("text=Create my roadmap");
    await page.waitForText("Roadmap created with");
    await page.click("[role=checkbox]");
    await page.waitFor("document.querySelector('[role=checkbox]').getAttribute('aria-checked') === 'true'");
    const { roadmap } = await fromBackend("/career/roadmap");
    check(roadmap.progress.doneTasks === 1, `doneTasks = ${roadmap.progress.doneTasks}`);
    check(await page.hasText(`${roadmap.progress.percentage}%`), "progress not shown on the page");
    await shot("roadmap_task_done");
  });

  // ---------------------------------------------------------------- 5. Dashboard + projects
  await step("Dashboard: shows the same readiness and roadmap progress as the API", async () => {
    await page.click("text=Dashboard");
    await page.waitForText("5 of 5 done");
    const summary = await fromBackend("/dashboard");
    check(await page.hasText(`${summary.careerReadiness.matchPercentage}%`), "readiness differs");
    check(await page.hasText(`Week ${summary.roadmap.currentWeek.week} of ${summary.roadmap.totalWeeks}`), "current week differs");
    await shot("dashboard_complete");
  });

  await step("Projects: recommendations load and the level filter works", async () => {
    await page.click("text=Projects");
    await page.waitForText("matching projects");
    await page.click("text=Beginner");
    await page.waitFor("[...document.querySelectorAll('[aria-pressed=true]')].some((b) => b.innerText === 'Beginner')");
    await page.waitFor("!document.body.innerText.includes('Updating...')");
    check(apiCount("GET", "/recommendations/projects") >= 2, "filter did not call the API");
    await shot("projects");
  });

  // ---------------------------------------------------------------- 6. Failed requests
  await step("Error handling: server unreachable -> clear message -> 'Try again' recovers", async () => {
    await page.failRequests(/\/api\/dashboard/, "fail");
    await page.click("text=Dashboard");
    await page.waitForText("Cannot reach the server");
    check(await page.hasText("Your progress could not be"), "no meaningful message");
    await shot("error_dashboard_unreachable");
    await page.stopFailing();
    await page.click("text=Try again");
    await page.waitForText("5 of 5 done");
    check(!(await page.hasText("Your progress could not be")), "error message still shown after recovery");
  });

  await step("Error handling: a 500 from the server is shown as a readable message", async () => {
    await page.failRequests(/\/api\/recommendations\/projects/, { status: 500, body: {} });
    await page.click("text=Projects");
    await page.waitForText("The server had a problem. Please try again in a moment.");
    await shot("error_projects_500");
    await page.stopFailing();
    await page.click("text=Try again");
    await page.waitForText("matching projects");
  });

  await step("Error handling: backend down on page load keeps the student logged in", async () => {
    await page.failRequests(/\/api\/auth\/me/, "fail");
    await page.goto(`${APP}/dashboard`);
    await page.waitForText("Can't connect to SkillSync");
    check(await page.eval("localStorage.getItem('skillsync_token') !== null"), "token was deleted");
    await shot("error_offline_on_load");
    await page.stopFailing();
    await page.click("text=Try again");
    await page.waitForText("Welcome, E2E!");
  });

  // ---------------------------------------------------------------- 7. Logout, login errors, login
  await step("Login: wrong password and duplicate e-mail show the server's message", async () => {
    await page.click("text=Logout");
    await page.waitFor("location.pathname === '/login'");
    await page.goto(`${APP}/register`);
    await page.type("#name", student.name);
    await page.type("#email", student.email);
    await page.type("#password", student.password);
    await page.type("#confirmPassword", student.password);
    await page.click("text=Create account");
    await page.waitForText("An account with this email already exists");
    await page.goto(`${APP}/login`);
    await page.type("#email", student.email);
    await page.type("#password", "wrong-pass-1");
    await page.click("text=Log in");
    await page.waitForText("Incorrect email or password");
    await shot("login_wrong_password");
  });

  await step("Login: correct password opens the dashboard with the saved data", async () => {
    await page.type("#password", student.password);
    await page.click("text=Log in");
    await page.waitFor("location.pathname === '/dashboard'");
    await page.waitForText("5 of 5 done");
  });

  // ---------------------------------------------------------------- 8. Clean-up through the UI
  await step("Delete account: all data removed, the old login no longer works", async () => {
    await page.click("text=Profile");
    await page.click("text=Delete my account");
    await page.type("#delete-password", student.password);
    await page.click("text=Delete permanently");
    await page.waitFor("location.pathname === '/login'");
    accountCreated = false;
    const res = await page.eval(`fetch(${JSON.stringify(API + "/auth/login")}, { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(${JSON.stringify({ email: student.email, password: student.password })}) }).then((r) => r.status)`);
    check(res === 401, `login after deletion returned ${res}`);
  });
} catch {
  // the failing step was already reported
} finally {
  // Safety net: if a step failed after registration, remove the test account through the API.
  if (accountCreated) {
    try {
      const login = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: student.email, password: student.password }) }).then((r) => r.json());
      await fetch(`${API}/profile`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
        body: JSON.stringify({ password: student.password }) });
      console.log("(test account removed)");
    } catch { console.log(`(could not remove ${student.email})`); }
  }
  await browser.close();
  fs.rmSync(pdfFile, { force: true });
}

// Every API call the browser made during the test: proof that each page talks to the backend.
const log = page.requests.map((r) => `${r.method.padEnd(6)} ${r.url.replace(API, "/api").padEnd(48)} ${r.status}`);
console.log(`\nThe browser made ${log.length} API requests (${page.requests.filter((r) => r.status === "failed").length} failed on purpose).`);
if (SHOTS) fs.writeFileSync(path.join(SHOTS, "api-requests.txt"), log.join("\n") + "\n");

const passed = results.filter(Boolean).length;
const total = 16;
console.log(`\n${passed} of ${total} workflow steps passed.`);
process.exitCode = passed === total ? 0 : 1;
