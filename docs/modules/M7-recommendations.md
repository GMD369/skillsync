# Module M7 – Recommendations

**Status:** Project recommendations done (Phase 1, Day 10). Internship recommendations are planned.  
**Requirements covered:** FR-13 (portfolio projects that use the student's missing skills). FR-14 (internships) is not done yet.

## What it does

- A new **`projects`** collection holds 21 portfolio project ideas. Each one has a title, description,
  level, the skills it practises, the features to build and an estimated number of hours. The ideas
  cover all five career roles and are loaded with `npm run seed:projects`.
- `GET /api/recommendations/projects` ranks the ideas for the logged-in student:
  - **practises missing skills**: skills the student's target role needs that they don't have yet;
  - **uses your skills**: skills the student already has, which make the project easier to start;
  - `score = 3 × missing skills practised + known skills − unrelated skills`;
  - projects that don't practise any missing skill are left out;
  - ties are broken by level, so easier projects come first.
- A student without a career goal gets projects that build on the skills they already have.
- Optional filters: `?level=beginner|intermediate|advanced` and `?limit=1..20`. Invalid values return `400`.
- `GET /api/recommendations/projects/:id` returns one project, or `404`.
- The **Projects** page shows the recommendations as cards with level filter buttons.

## Files

| File | Responsibility |
|---|---|
| `backend/src/models/Project.js` | Schema: unique title, at least one skill, level enum, hours 1–200 |
| `backend/src/data/projects.js` | The 21 project ideas (skill names match the career roles) |
| `backend/scripts/seed-projects.js` | Inserts or updates the ideas (safe to run again) |
| `backend/src/services/recommendations.js` | `rankProjects()` matching and ranking |
| `backend/src/controllers/recommendation.controller.js` | Query validation, list and detail endpoints |
| `frontend/src/app/projects/page.js` | Projects page |
| `backend/tests/recommendations.test.js` | 8 tests |

## Next step

Internship recommendations (T7.2): collect 30+ internships, seed them, and rank them with the same skill-overlap logic.
