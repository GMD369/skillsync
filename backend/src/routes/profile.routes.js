import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { notImplemented } from "../utils/notImplemented.js";

// Profile and resume module
const router = Router();
router.use(requireAuth);
router.get("/", notImplemented("Get profile"));
router.put("/", notImplemented("Update profile"));
router.post("/resume", notImplemented("Resume upload and analysis"));

export default router;
