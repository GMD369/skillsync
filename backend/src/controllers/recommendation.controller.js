import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { compareSkills } from "../services/skillGap.js";
import { rankProjects } from "../services/recommendations.js";

const LEVELS = ["beginner", "intermediate", "advanced"];

// Reads and checks the optional query parameters ?limit=1..20&level=beginner|intermediate|advanced
function parseQuery(query) {
  const errors = {};
  let limit = 6;
  if (query.limit !== undefined) {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) errors.limit = "limit must be a whole number from 1 to 20";
  }
  const level = query.level;
  if (level !== undefined && !LEVELS.includes(level)) errors.level = `level must be one of: ${LEVELS.join(", ")}`;
  return { limit, level, errors };
}

// GET /api/recommendations/projects (FR-13) - project ideas ranked for the logged-in student
export async function getProjectRecommendations(req, res, next) {
  try {
    const { limit, level, errors } = parseQuery(req.query);
    if (Object.keys(errors).length) return res.status(400).json({ message: "Invalid query parameters", errors });

    const user = await User.findById(req.user.id).populate("targetRole");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });

    const gap = user.targetRole ? compareSkills(user.skills, user.targetRole).skills : [];
    const projects = await Project.find(level ? { level } : {});
    const ranked = rankProjects(projects, user.skills, gap);

    res.json({
      basedOn: {
        targetRole: user.targetRole?.title ?? null,
        missingSkills: gap.filter((s) => s.status !== "done").map((s) => s.name),
      },
      total: ranked.length,
      recommendations: ranked.slice(0, limit),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/recommendations/projects/:id - one project idea with its details
export async function getProject(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Project not found" });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}
