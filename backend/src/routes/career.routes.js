import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";
import { getRoles, getSkillGap, selectTargetRole } from "../controllers/career.controller.js";

// Career roles, skill gap analysis and learning roadmap module
const router = Router();
router.get("/roles", getRoles);
router.put("/target-role", requireAuth, selectTargetRole);
router.get("/skill-gap", requireAuth, getSkillGap);
router.post("/roadmap", requireAuth, notImplemented("Generate roadmap"));
router.get("/roadmap", requireAuth, notImplemented("Get roadmap"));
router.patch("/roadmap/tasks/:taskId", requireAuth, notImplemented("Update roadmap task"));

export default router;
