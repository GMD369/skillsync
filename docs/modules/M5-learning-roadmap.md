# Module M5 – Learning Roadmap

**Status:** Database layer, API and page done (Phase 1, Day 9). AI-generated tasks are the next step.  
**Requirements covered:** FR-10 (partly: weekly plan for missing skills; free resources come with the AI step), FR-11 (mark tasks as done, progress saved)

## What it does

- Creates a **roadmap** from the student's skill-gap report: **one week per missing skill**, in the order the
  career role lists them.
- Each week has tasks from templates: 2 tasks for a basic skill, 3 for intermediate, 4 for advanced.
- The student ticks tasks off; the completion time is saved and progress is recalculated.
- A skill with at least one finished task shows as **"In progress"** in the skill-gap report.
- The dashboard shows roadmap progress and ticks the "Generate your learning roadmap" step.
- If the student changes their career goal, the roadmap is marked **outdated** and can be regenerated.
- The roadmap can be deleted; it is also deleted automatically when the account is deleted.

## API (all require a JWT)

| Method | Endpoint | Operation | Result |
|---|---|---|---|
| POST | `/api/career/roadmap` | Create (replaces an old roadmap) | `201 { roadmap, outdated }`; `400` with no target role or no missing skills |
| GET | `/api/career/roadmap` | Read | `{ roadmap, outdated }`; `404` if none yet |
| PATCH | `/api/career/roadmap/tasks/:taskId` | Update `{ done: true \| false }` | updated task + roadmap with new progress; `400` if `done` is not a boolean; `404` for another student's task |
| DELETE | `/api/career/roadmap` | Delete | `200`; `404` if there is nothing to delete |

`roadmap.progress` = `{ totalTasks, doneTasks, percentage }`.

## Files

| File | Responsibility |
|---|---|
| `backend/src/models/Roadmap.js` | Schema (weeks → tasks embedded), unique index on `user`, `progress()` method |
| `backend/src/services/skillGap.js` | `compareSkills()` (shared with M4) and `buildRoadmapWeeks()` task templates |
| `backend/src/controllers/career.controller.js` | `createRoadmap`, `getRoadmap`, `updateRoadmapTask`, `deleteRoadmap` |
| `frontend/src/app/roadmap/page.js` | Roadmap page: create, tick tasks, regenerate, delete |
| `backend/tests/roadmap.test.js` | 13 tests |

## Next step

`buildRoadmapWeeks()` will be replaced by a call to the AI service (`POST /roadmap/generate`), which will
return personalized tasks and free learning resources as validated JSON. The database structure already
supports it (`source: "ai"`), so the API and the page do not need to change.
