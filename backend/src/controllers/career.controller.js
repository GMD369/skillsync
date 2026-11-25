import mongoose from "mongoose";
import CareerRole from "../models/CareerRole.js";
import User from "../models/User.js";
import Roadmap from "../models/Roadmap.js";
import { compareSkills, buildRoadmapWeeks } from "../services/skillGap.js";

function roleView(role) {
  return {
    id: role._id.toString(),
    title: role.title,
    description: role.description,
    requiredSkills: role.requiredSkills,
  };
}

// GET /api/career/roles (FR-08) - public list used on the role-selection page.
export async function getRoles(req, res, next) {
  try {
    const roles = await CareerRole.find().sort({ title: 1 });
    res.json({ roles: roles.map(roleView) });
  } catch (err) {
    next(err);
  }
}

// PUT /api/career/target-role (FR-08) - save the logged-in student's goal.
export async function selectTargetRole(req, res, next) {
  try {
    const { roleId } = req.body || {};
    if (!roleId || !mongoose.isValidObjectId(roleId)) {
      return res.status(400).json({
        message: "Please choose a valid career role",
        errors: { roleId: "Select one of the available career roles" },
      });
    }

    const role = await CareerRole.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: "The selected career role was not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    user.targetRole = role._id;
    await user.save();

    res.json({ message: `${role.title} selected as your career goal`, role: roleView(role), user });
  } catch (err) {
    next(err);
  }
}

// GET /api/career/skill-gap (FR-09) - compare normalized profile skills with the role requirements.
export async function getSkillGap(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate("targetRole");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (!user.targetRole) {
      return res.status(400).json({ message: "Choose a career role before viewing your skill gap" });
    }
    const roadmap = await Roadmap.findOne({ user: user._id, role: user.targetRole._id });
    res.json({ role: roleView(user.targetRole), ...compareSkills(user.skills, user.targetRole, roadmap) });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Learning roadmap (M5) - full CRUD on the "roadmaps" collection.
// Tasks come from templates for now; the AI generator will replace buildRoadmapWeeks().
// ---------------------------------------------------------------------------

function roadmapView(roadmap, user) {
  return {
    roadmap: { ...roadmap.toJSON(), progress: roadmap.progress() },
    // true when the student changed their target role after creating this roadmap
    outdated: String(roadmap.role._id ?? roadmap.role) !== String(user.targetRole?._id ?? user.targetRole),
  };
}

// POST /api/career/roadmap - CREATE (replaces an existing roadmap for the student)
export async function createRoadmap(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate("targetRole");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    if (!user.targetRole) {
      return res.status(400).json({ message: "Choose a career role before creating a roadmap" });
    }
    const { skills } = compareSkills(user.skills, user.targetRole);
    const weeks = buildRoadmapWeeks(skills);
    if (!weeks.length) {
      return res.status(400).json({ message: "You already have every skill for this role. No roadmap is needed." });
    }

    await Roadmap.deleteOne({ user: user._id }); // one roadmap per student
    const roadmap = await Roadmap.create({ user: user._id, role: user.targetRole._id, source: "rules", weeks });
    await roadmap.populate("role", "title");
    res.status(201).json({ message: `Roadmap created with ${weeks.length} weeks`, ...roadmapView(roadmap, user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/career/roadmap - READ
export async function getRoadmap(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    const roadmap = await Roadmap.findOne({ user: user._id }).populate("role", "title");
    if (!roadmap) return res.status(404).json({ message: "You have not created a roadmap yet" });
    res.json(roadmapView(roadmap, user));
  } catch (err) {
    next(err);
  }
}

// PATCH /api/career/roadmap/tasks/:taskId - UPDATE one task ({ done: true | false })
export async function updateRoadmapTask(req, res, next) {
  try {
    const { done } = req.body || {};
    if (typeof done !== "boolean") {
      return res.status(400).json({ message: "done must be true or false", errors: { done: "Must be true or false" } });
    }
    if (!mongoose.isValidObjectId(req.params.taskId)) {
      return res.status(404).json({ message: "Task not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists" });

    // Only the student's own roadmap is searched, so nobody can change another student's tasks.
    const roadmap = await Roadmap.findOne({ user: user._id, "weeks.tasks._id": req.params.taskId });
    if (!roadmap) return res.status(404).json({ message: "Task not found" });

    const task = roadmap.weeks.flatMap((w) => w.tasks).find((t) => t._id.equals(req.params.taskId));
    task.done = done;
    task.doneAt = done ? new Date() : null;
    await roadmap.save();
    await roadmap.populate("role", "title");
    res.json({ message: done ? "Task completed" : "Task marked as not done", task, ...roadmapView(roadmap, user) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/career/roadmap - DELETE
export async function deleteRoadmap(req, res, next) {
  try {
    const result = await Roadmap.deleteOne({ user: req.user.id });
    if (!result.deletedCount) return res.status(404).json({ message: "You have not created a roadmap yet" });
    res.json({ message: "Roadmap deleted" });
  } catch (err) {
    next(err);
  }
}
