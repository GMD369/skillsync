import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getRoles, getSkillGap, selectTargetRole,
  createRoadmap, getRoadmap, updateRoadmapTask, deleteRoadmap,
} from "../controllers/career.controller.js";

// Career roles, skill gap analysis and learning roadmap module
const router = Router();
router.get("/roles", getRoles);
router.put("/target-role", requireAuth, selectTargetRole);
router.get("/skill-gap", requireAuth, getSkillGap);
router.post("/roadmap", requireAuth, createRoadmap);
router.get("/roadmap", requireAuth, getRoadmap);
router.patch("/roadmap/tasks/:taskId", requireAuth, updateRoadmapTask);
router.delete("/roadmap", requireAuth, deleteRoadmap);

export default router;
