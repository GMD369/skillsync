// Calls the Python AI service (resume analysis, roadmap generation, interview feedback).
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function callAI(path, body) {
  const res = await fetch(`${AI_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AI service error (${res.status})`);
  return res.json();
}
