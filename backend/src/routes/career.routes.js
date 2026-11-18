import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";

// Career roles, skill gap analysis and learning roadmap module
const router = Router();
router.get("/roles", notImplemented("List career roles"));
router.get("/skill-gap", requireAuth, notImplemented("Skill gap analysis"));
router.post("/roadmap", requireAuth, notImplemented("Generate roadmap"));
router.get("/roadmap", requireAuth, notImplemented("Get roadmap"));
router.patch("/roadmap/tasks/:taskId", requireAuth, notImplemented("Update roadmap task"));

export default router;
