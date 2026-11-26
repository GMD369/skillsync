import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

// Progress dashboard module (M6)
const router = Router();
router.get("/", requireAuth, getDashboard);

export default router;
