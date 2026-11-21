import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { loginRateLimit } from "../middleware/rateLimit.middleware.js";

// Authentication module (M1)
const router = Router();
router.post("/register", register);
router.post("/login", loginRateLimit, login);
router.get("/me", requireAuth, getMe);

export default router;
