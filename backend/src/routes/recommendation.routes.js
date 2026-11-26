import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";
import { getProjectRecommendations, getProject } from "../controllers/recommendation.controller.js";

// Project and internship recommendations module (M7)
const router = Router();
router.use(requireAuth);
router.get("/projects", getProjectRecommendations);
router.get("/projects/:id", getProject);
router.get("/internships", notImplemented("Internship recommendations"));

export default router;
