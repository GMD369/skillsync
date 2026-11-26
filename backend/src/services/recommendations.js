// Ranks portfolio project ideas for a student (M7, FR-13).
// A project is useful when it practises skills the student is MISSING for their target role,
// and easier to start when it also uses skills they ALREADY have.

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
const lower = (list) => new Set(list.map((s) => s.trim().toLowerCase()));

// projects: Project documents; userSkills: string[]; gapSkills: compareSkills().skills (or [] with no role)
export function rankProjects(projects, userSkills, gapSkills = []) {
  const have = lower(userSkills);
  const missing = lower(gapSkills.filter((s) => s.status !== "done").map((s) => s.name));

  return projects
    .map((project) => {
      const practises = project.skills.filter((s) => missing.has(s.toLowerCase()));
      const uses = project.skills.filter((s) => have.has(s.toLowerCase()));
      const other = project.skills.length - practises.length - uses.length;
      // Missing skills count most, known skills make the project easier, unrelated skills add work.
      const score = practises.length * 3 + uses.length - other;
      return {
        project: project.toJSON(),
        match: {
          score,
          practisesMissingSkills: practises,
          usesYourSkills: uses,
          readyPercentage: Math.round((uses.length / project.skills.length) * 100),
        },
      };
    })
    // With a target role only projects that practise a missing skill are shown;
    // without one, projects that build on the student's current skills are shown.
    .filter(({ match }) => (missing.size ? match.practisesMissingSkills.length > 0 : match.usesYourSkills.length > 0))
    .sort((a, b) => b.match.score - a.match.score
      || LEVEL_ORDER[a.project.level] - LEVEL_ORDER[b.project.level]
      || a.project.title.localeCompare(b.project.title));
}
