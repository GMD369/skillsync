# Module M6 – Progress Dashboard

**Status:** Summary API and dashboard connected (Phase 1, Day 10). A progress chart over time is still to do.  
**Requirements covered:** FR-12 (dashboard with career readiness %, completed skills and current roadmap week)

## What it does

`GET /api/dashboard` returns everything the dashboard shows in **one request**. Before Day 10 the page
made separate calls to the skill-gap and roadmap endpoints and worked out the checklist in the browser.
The response contains:

| Part | Content |
|---|---|
| `profile` | profile complete, number of skills, resume uploaded, skills detected in the resume |
| `careerReadiness` | target role and skill match % (with done / in progress / missing counts) |
| `roadmap` | progress, number of weeks, **current week** (first week with unfinished tasks), **next task**, outdated flag |
| `checklist` | the five getting-started steps, each with a `done` flag and a link |
| `checklistProgress` | done / total / percentage |

**Career readiness** is the skill match percentage from M4. A skill counts as "in progress" when the
student has finished at least one roadmap task for it. This only applies while the roadmap belongs to
the student's current target role.

## Files

| File | Responsibility |
|---|---|
| `backend/src/controllers/dashboard.controller.js` | Builds the summary from `users`, `careerroles` and `roadmaps` |
| `backend/src/routes/dashboard.routes.js` | `GET /api/dashboard` (JWT required) |
| `frontend/src/app/dashboard/page.js` | Stat cards and checklist from the summary |
| `backend/tests/dashboard.test.js` | 6 tests (also covers `/health` and error responses) |

## Next step

A progress chart (Chart.js) that shows completed tasks per week (T6.3).
