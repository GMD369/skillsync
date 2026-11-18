import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";

// AI interview preparation module
const router = Router();
router.use(requireAuth);
router.get("/questions", notImplemented("Interview questions"));
router.post("/answers", notImplemented("Answer evaluation"));

export default router;
