import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import careerRoutes from "./career.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import recommendationRoutes from "./recommendation.routes.js";
import interviewRoutes from "./interview.routes.js";

// All API routes, mounted under /api in server.js
const router = Router();
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/career", careerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/interview", interviewRoutes);

export default router;
