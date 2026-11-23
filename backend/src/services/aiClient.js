// Calls the Python AI service (resume analysis, roadmap generation, interview feedback).
const aiUrl = () => process.env.AI_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 15000; // NFR-01: AI requests must finish within 15 seconds

export class AIServiceError extends Error {}

// Converts typed skills to standard names ("Nextjs" -> "Next.js") and removes duplicates.
// If the AI service is unavailable the skills are returned unchanged, so saving never fails.
export async function normalizeSkills(skills) {
  try {
    const res = await fetch(`${aiUrl()}/skills/normalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return skills;
    const data = await res.json();
    return Array.isArray(data.skills) ? data.skills : skills;
  } catch {
    return skills;
  }
}

// Sends a resume PDF to the AI service and returns the list of detected skills.
export async function analyzeResume(buffer, originalName) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "application/pdf" }), originalName);

  let res;
  try {
    res = await fetch(`${aiUrl()}/resume/analyze`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new AIServiceError("The AI service is not reachable");
  }
  if (!res.ok) throw new AIServiceError(`The AI service returned an error (${res.status})`);
  const data = await res.json();
  return Array.isArray(data.skills) ? data.skills : [];
}
