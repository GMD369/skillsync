import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// GET /api/health - quick check that the API is up
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "skillsync-backend",
    database: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

export default router;
