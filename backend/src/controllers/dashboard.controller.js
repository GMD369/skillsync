import User from "../models/User.js";
import Roadmap from "../models/Roadmap.js";
import { compareSkills } from "../services/skillGap.js";

// GET /api/dashboard (M6, FR-12) - everything the dashboard needs in one request:
// career readiness, roadmap progress with the current week, and the getting-started checklist.
export async function getDashboard(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate("targetRole");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    const roadmap = await Roadmap.findOne({ user: user._id }).populate("role", "title");
    const roadmapMatchesGoal = Boolean(roadmap && user.targetRole && roadmap.role._id.equals(user.targetRole._id));

    let careerReadiness = { targetRole: null, matchPercentage: null, summary: null };
    if (user.targetRole) {
      const { summary } = compareSkills(user.skills, user.targetRole, roadmapMatchesGoal ? roadmap : null);
      careerReadiness = {
        targetRole: { id: user.targetRole._id.toString(), title: user.targetRole.title },
        matchPercentage: summary.matchPercentage,
        summary,
      };
    }

    let roadmapSummary = null;
    if (roadmap) {
      // The current week is the first week that still has unfinished tasks.
      const week = roadmap.weeks.find((w) => w.tasks.some((t) => !t.done));
      const nextTask = week?.tasks.find((t) => !t.done);
      roadmapSummary = {
        role: roadmap.role.title,
        totalWeeks: roadmap.weeks.length,
        progress: roadmap.progress(),
        outdated: !roadmapMatchesGoal,
        currentWeek: week
          ? { week: week.week, skill: week.skill, nextTask: { id: nextTask._id.toString(), title: nextTask.title } }
          : null, // null = every task is done
      };
    }

    const checklist = [
      { key: "account", label: "Create your account", done: true },
      { key: "profile", label: "Complete your profile", done: user.profileComplete, href: "/profile" },
      { key: "resume", label: "Upload your resume", done: Boolean(user.resume), href: "/profile" },
      { key: "careerGoal", label: "Choose a career goal", done: Boolean(user.targetRole), href: "/skill-gap" },
      { key: "roadmap", label: "Generate your learning roadmap", done: Boolean(roadmap), href: "/roadmap" },
    ];
    const done = checklist.filter((c) => c.done).length;

    res.json({
      profile: {
        complete: user.profileComplete,
        skillsCount: user.skills.length,
        resumeUploaded: Boolean(user.resume),
        detectedSkillsCount: user.resume?.detectedSkills.length ?? 0,
      },
      careerReadiness,
      roadmap: roadmapSummary,
      checklist,
      checklistProgress: { done, total: checklist.length, percentage: Math.round((done / checklist.length) * 100) },
    });
  } catch (err) {
    next(err);
  }
}
