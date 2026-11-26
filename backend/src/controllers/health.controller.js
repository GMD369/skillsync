import mongoose from "mongoose";

const aiUrl = () => process.env.AI_SERVICE_URL || "http://localhost:8000";

// GET /api/health - quick check that the API, the database and the AI service are up
export async function getHealth(req, res) {
  let aiService = "not reachable";
  try {
    const r = await fetch(`${aiUrl()}/health`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) aiService = "connected";
  } catch {
    // The API keeps working without the AI service; AI features show an error or fall back.
  }

  res.json({
    status: "ok",
    service: "skillsync-backend",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
    databaseName: mongoose.connection.name || null,
    aiService,
  });
}
