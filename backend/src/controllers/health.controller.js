import mongoose from "mongoose";

// GET /api/health - quick check that the API is up
export function getHealth(req, res) {
  res.json({
    status: "ok",
    service: "skillsync-backend",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
}
