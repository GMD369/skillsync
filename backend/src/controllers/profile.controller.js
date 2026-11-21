import User from "../models/User.js";
import { validateProfile, cleanList } from "../utils/validators.js";
import { saveResume, deleteResume, resumePath } from "../services/resumeStorage.js";
import { analyzeResume, AIServiceError } from "../services/aiClient.js";

const PROFILE_FIELDS = ["name", "university", "degree", "graduationYear", "skills", "interests"];

async function currentUser(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) res.status(401).json({ message: "Account no longer exists" });
  return user;
}

// GET /api/profile  (FR-04)
export async function getProfile(req, res, next) {
  try {
    const user = await currentUser(req, res);
    if (user) res.json({ user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/profile  (FR-04, FR-05) - partial update: only the fields sent are changed
export async function updateProfile(req, res, next) {
  try {
    const errors = validateProfile(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Please fix the highlighted fields", errors });
    }
    const user = await currentUser(req, res);
    if (!user) return;

    for (const field of PROFILE_FIELDS) {
      if (req.body[field] === undefined) continue;
      const value = req.body[field];
      if (field === "skills" || field === "interests") user[field] = cleanList(value);
      else if (field === "graduationYear") user[field] = value === "" || value === null ? null : Number(value);
      else user[field] = value.trim();
    }
    await user.save();
    res.json({ message: "Profile saved", user });
  } catch (err) {
    next(err);
  }
}

// POST /api/profile/resume  (FR-06, FR-07)
// Saves the PDF, sends it to the AI service and returns the detected skills.
// The skills are NOT added automatically: the student confirms them first.
export async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose a PDF file to upload" });
    }
    // Check the real file content, not just the name: every PDF starts with "%PDF-".
    if (req.file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ message: "This file is not a valid PDF" });
    }
    const user = await currentUser(req, res);
    if (!user) return;

    // Analyse first; if the AI service is down the upload still succeeds (NFR-06 reliability).
    let detectedSkills = [];
    let analysis = "completed";
    try {
      detectedSkills = cleanList(await analyzeResume(req.file.buffer, req.file.originalname));
    } catch (err) {
      if (!(err instanceof AIServiceError)) throw err;
      analysis = "unavailable";
    }

    const fileName = await saveResume(user._id, req.file.buffer);
    const oldFile = user.resume?.fileName;
    user.resume = {
      fileName,
      originalName: req.file.originalname.slice(0, 120),
      size: req.file.size,
      uploadedAt: new Date(),
      detectedSkills,
    };
    await user.save();
    if (oldFile) await deleteResume(oldFile); // replace the previous resume

    const newSkills = detectedSkills.filter((s) => !user.skills.some((k) => k.toLowerCase() === s.toLowerCase()));
    res.status(201).json({
      message: analysis === "completed"
        ? `Resume uploaded. ${detectedSkills.length} skill${detectedSkills.length === 1 ? "" : "s"} detected.`
        : "Resume uploaded, but the AI analyzer is not available right now. Please try again later.",
      analysis,
      detectedSkills,
      newSkills,
      user,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/profile/resume - download your own resume
export async function downloadResume(req, res, next) {
  try {
    const user = await currentUser(req, res);
    if (!user) return;
    if (!user.resume) return res.status(404).json({ message: "No resume uploaded yet" });
    res.download(resumePath(user.resume.fileName), user.resume.originalName, (err) => {
      if (err && !res.headersSent) res.status(404).json({ message: "Resume file not found" });
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/profile/resume - remove the resume (NFR-09 privacy)
export async function removeResume(req, res, next) {
  try {
    const user = await currentUser(req, res);
    if (!user) return;
    if (!user.resume) return res.status(404).json({ message: "No resume uploaded yet" });
    await deleteResume(user.resume.fileName);
    user.resume = null;
    await user.save();
    res.json({ message: "Resume deleted", user });
  } catch (err) {
    next(err);
  }
}
