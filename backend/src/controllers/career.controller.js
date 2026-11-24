import mongoose from "mongoose";
import CareerRole from "../models/CareerRole.js";
import User from "../models/User.js";

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

    const current = new Set(user.skills.map((skill) => skill.trim().toLowerCase()));
    const skills = user.targetRole.requiredSkills.map((required) => ({
      name: required.name,
      level: required.level,
      status: current.has(required.name.trim().toLowerCase()) ? "done" : "missing",
    }));
    const done = skills.filter((skill) => skill.status === "done").length;
    const total = skills.length;

    res.json({
      role: roleView(user.targetRole),
      summary: {
        total,
        done,
        inProgress: 0,
        missing: total - done,
        matchPercentage: total ? Math.round((done / total) * 100) : 0,
      },
      skills,
    });
  } catch (err) {
    next(err);
  }
}
