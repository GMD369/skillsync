# Module M4 – Career Role & Skill Gap Analysis

**Status:** First working version (Phase 1, Day 8)  
**Requirements covered:** FR-08 (choose a career role), FR-09 (compare skills and calculate a match percentage)

## What it does

- Lists five approved career paths: Frontend Developer, Backend Developer, Full-Stack Developer,
  Data Analyst and AI/ML Beginner.
- Saves the selected role on the logged-in student's existing profile.
- Compares the normalized profile skills from M2/M3 with the role's required skills.
- Returns each required skill's level and status, plus matched/missing counts and a match percentage.
- Displays the result on the Skill Gap page and reuses the percentage on the Dashboard.

`inProgress` is currently zero because SkillSync does not yet collect skill proficiency or roadmap
progress. M5 will provide that evidence; the application does not guess a student's proficiency.

## Flow

```text
Career roles in MongoDB -> GET /api/career/roles -> role cards
selected role -> PUT /api/career/target-role -> User.targetRole
User.skills + CareerRole.requiredSkills -> GET /api/career/skill-gap
                                      -> per-skill status + match percentage
                                      -> Skill Gap page + Dashboard
```

## API

| Method | Endpoint | Auth | Result |
|---|---|---|---|
| GET | `/api/career/roles` | No | Available roles and required skills |
| PUT | `/api/career/target-role` | JWT | Validates and saves `{ roleId }` |
| GET | `/api/career/skill-gap` | JWT | Role, summary and per-skill results |

Expected errors include `400` for a malformed role ID or a gap request before choosing a role,
`401` without a valid token and `404` when the selected role no longer exists.

## Setup and testing

```bash
cd backend
npm run seed:roles
npm test
```

The seed is repeatable: it updates roles by title instead of creating duplicates. Automated M4 tests
cover the public role list, authentication, invalid IDs, missing roles, persistence, case-insensitive
matching, percentage calculation and an empty requirement list.
