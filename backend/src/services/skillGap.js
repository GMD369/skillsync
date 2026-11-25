// Compares a student's skills with a career role's required skills (M4).
// A missing skill counts as "in_progress" when the student has finished at least one
// roadmap task for it (M5), so progress shows up before the skill is added to the profile.
export function compareSkills(userSkills, role, roadmap = null) {
  const current = new Set(userSkills.map((skill) => skill.trim().toLowerCase()));
  const started = new Set(
    (roadmap?.weeks || [])
      .filter((week) => week.tasks.some((task) => task.done))
      .map((week) => week.skill.toLowerCase())
  );

  const skills = role.requiredSkills.map((required) => {
    const key = required.name.trim().toLowerCase();
    const status = current.has(key) ? "done" : started.has(key) ? "in_progress" : "missing";
    return { name: required.name, level: required.level, status };
  });

  const count = (status) => skills.filter((skill) => skill.status === status).length;
  const total = skills.length;
  const done = count("done");
  return {
    skills,
    summary: {
      total,
      done,
      inProgress: count("in_progress"),
      missing: count("missing"),
      matchPercentage: total ? Math.round((done / total) * 100) : 0,
    },
  };
}

// Task templates used until the AI roadmap generator (M5) is connected.
// Higher levels get more practice tasks.
const TEMPLATES = {
  basic: ["Learn the core concepts of {skill}", "Complete 3 small {skill} practice exercises"],
  intermediate: [
    "Learn the core concepts of {skill}",
    "Complete 3 small {skill} practice exercises",
    "Use {skill} in a mini project and push it to GitHub",
  ],
  advanced: [
    "Learn the core concepts of {skill}",
    "Complete 3 small {skill} practice exercises",
    "Use {skill} in a mini project and push it to GitHub",
    "Study advanced {skill} topics and best practices",
  ],
};

// One week per missing (or in-progress) skill, in the order the role lists them.
export function buildRoadmapWeeks(gapSkills) {
  return gapSkills
    .filter((skill) => skill.status !== "done")
    .map((skill, index) => ({
      week: index + 1,
      skill: skill.name,
      level: skill.level,
      tasks: (TEMPLATES[skill.level] || TEMPLATES.basic).map((t) => ({ title: t.replace("{skill}", skill.name) })),
    }));
}
