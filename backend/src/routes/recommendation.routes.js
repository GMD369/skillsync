import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";

// Project and internship recommendations module
const router = Router();
router.use(requireAuth);
router.get("/projects", notImplemented("Project recommendations"));
router.get("/internships", notImplemented("Internship recommendations"));

export default router;
