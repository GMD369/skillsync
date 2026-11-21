import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadResume as parseResumeUpload } from "../middleware/upload.middleware.js";
import {
  getProfile, updateProfile, uploadResume, downloadResume, removeResume,
} from "../controllers/profile.controller.js";

// Profile & Resume module (M2). Every route needs a logged-in student.
const router = Router();
router.use(requireAuth);
router.get("/", getProfile);
router.put("/", updateProfile);
router.post("/resume", parseResumeUpload, uploadResume);
router.get("/resume", downloadResume);
router.delete("/resume", removeResume);

export default router;
