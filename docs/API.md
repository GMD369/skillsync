# SkillSync REST API

**Base URL (local):** `http://localhost:5000/api`  
**Format:** JSON requests and responses (the resume upload uses `multipart/form-data`)  
**Server:** Node.js + Express 5, MongoDB through Mongoose, AI features through the FastAPI service

## How the frontend talks to the backend

```text
Browser (Next.js)  --HTTP request (JSON + JWT)-->  Express API  --Mongoose-->  MongoDB
       ^                                              |   \
       |                                              |    --HTTP--> AI service (FastAPI, port 8000)
       +-------------- HTTP response (JSON) <---------+
```

1. The page calls `apiRequest()` in `frontend/src/lib/api.js`, which sends the request with the
   `Authorization: Bearer <token>` header.
2. Express runs the middleware in order: request logger → CORS → JSON body parser → route.
3. Protected routes run `requireAuth` first. It verifies the JWT and sets `req.user.id`.
4. The controller validates the input, then reads or writes MongoDB (and calls the AI service when needed).
5. It sends a JSON response with a suitable status code. All errors go through one error handler.

## Authentication

1. `POST /auth/register` or `POST /auth/login` returns a **JWT** (valid for 7 days).
2. Send it on every protected request: `Authorization: Bearer <token>`.
3. If the token is missing, invalid or expired, the API returns `401`, and the frontend logs the student out.

## Response format and status codes

| Code | Meaning in SkillSync | Example body |
|---|---|---|
| 200 | OK (read, update, delete) | `{ "message": "Profile saved", "user": {...} }` |
| 201 | Created | `{ "message": "Roadmap created with 2 weeks", "roadmap": {...} }` |
| 400 | Invalid input | `{ "message": "Please fix the highlighted fields", "errors": { "email": "..." } }` |
| 401 | Not logged in / wrong password at login | `{ "message": "Login required" }` |
| 404 | Record or route not found | `{ "message": "Task not found" }` |
| 409 | Duplicate (email already registered) | `{ "message": "An account with this email already exists" }` |
| 413 | Resume larger than 2 MB | `{ "message": "The file is too large. Maximum size is 2 MB." }` |
| 429 | Too many failed logins (5 in 15 minutes) | `{ "message": "Too many failed login attempts..." }` |
| 501 | Planned endpoint, not built yet | `{ "message": "Interview questions is planned but not implemented yet" }` |
| 500 | Unexpected server error (details only in the server log) | `{ "message": "Something went wrong on the server" }` |

Every error has a `message`. Validation errors also include `errors`, which maps each field to its
message, so the frontend can show the error next to the right input.

## Endpoints

✅ = implemented and tested. JWT = needs the `Authorization` header.

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` ✅ | – | API status, database status and AI-service status |

```json
{ "status": "ok", "service": "skillsync-backend", "database": "connected", "databaseName": "skillsync", "aiService": "connected" }
```

### Authentication (M1)

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` ✅ | – | `{ name, email, password }` | `201 { message, token, user }` |
| POST | `/auth/login` ✅ | – | `{ email, password }` | `200 { message, token, user }` |
| GET | `/auth/me` ✅ | JWT | – | `200 { user }` |

Rules:
- `name` must be 2–60 characters.
- `email` must be valid and not already registered (otherwise `409`).
- `password` must be 8–72 bytes and contain at least one letter and one number.

### Profile and resume (M2, M3)

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/profile` ✅ | JWT | – | `200 { user }` |
| PUT | `/profile` ✅ | JWT | any of `{ name, university, degree, graduationYear, skills[], interests[] }` | `200 { message, user }` |
| DELETE | `/profile` ✅ | JWT | `{ password }` | `200` – deletes the account, roadmap and resume file |
| POST | `/profile/resume` ✅ | JWT | form-data field `resume` (PDF, ≤ 2 MB) | `201 { message, analysis, detectedSkills, newSkills, user }` |
| GET | `/profile/resume` ✅ | JWT | – | the PDF file (`application/pdf`) |
| DELETE | `/profile/resume` ✅ | JWT | – | `200 { message, user }` |

Partial updates are allowed: fields that are not sent stay unchanged. Before saving, skills are sent to
the AI service to standardize their names (`"Nodejs"` becomes `"Node.js"`). If the AI service is down,
the skills are saved exactly as typed. In the same way, a resume upload still succeeds when the AI
service is down; the response then has `analysis: "unavailable"`.

### Career and skill gap (M4)

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| GET | `/career/roles` ✅ | – | – | `200 { roles: [{ id, title, description, requiredSkills }] }` |
| PUT | `/career/target-role` ✅ | JWT | `{ roleId }` | `200 { message, role, user }`; `400` invalid id; `404` unknown role |
| GET | `/career/skill-gap` ✅ | JWT | – | `200 { role, skills: [{ name, level, status }], summary }` |

`status` is `done`, `in_progress` or `missing`. The `summary` object contains
`{ total, done, inProgress, missing, matchPercentage }`.

### Learning roadmap (M5)

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/career/roadmap` ✅ | JWT | – | `201 { message, roadmap, outdated }` (replaces an old roadmap) |
| GET | `/career/roadmap` ✅ | JWT | – | `200 { roadmap, outdated }`; `404` if none |
| PATCH | `/career/roadmap/tasks/:taskId` ✅ | JWT | `{ done: true \| false }` | `200 { message, task, roadmap, outdated }` |
| DELETE | `/career/roadmap` ✅ | JWT | – | `200 { message }`; `404` if none |

### Dashboard (M6)

| Method | Endpoint | Auth | Success |
|---|---|---|---|
| GET | `/dashboard` ✅ | JWT | `200` – everything the dashboard needs in one request |

```json
{
  "profile": { "complete": true, "skillsCount": 26, "resumeUploaded": true, "detectedSkillsCount": 24 },
  "careerReadiness": {
    "targetRole": { "id": "6b05...", "title": "Full-Stack Developer" },
    "matchPercentage": 80,
    "summary": { "total": 10, "done": 8, "inProgress": 1, "missing": 1, "matchPercentage": 80 }
  },
  "roadmap": {
    "role": "Full-Stack Developer", "totalWeeks": 2, "outdated": false,
    "progress": { "totalTasks": 5, "doneTasks": 2, "percentage": 40 },
    "currentWeek": { "week": 1, "skill": "REST APIs", "nextTask": { "id": "6b06...", "title": "Use REST APIs in a mini project and push it to GitHub" } }
  },
  "checklist": [{ "key": "account", "label": "Create your account", "done": true }, "..."],
  "checklistProgress": { "done": 5, "total": 5, "percentage": 100 }
}
```

If the student has no target role yet, `careerReadiness` fields are `null`. If they have no roadmap,
`roadmap` is `null`. If every roadmap task is done, `currentWeek` is `null`.

### Recommendations (M7)

| Method | Endpoint | Auth | Query | Success |
|---|---|---|---|---|
| GET | `/recommendations/projects` ✅ | JWT | `limit` 1–20 (default 6), `level` = `beginner` \| `intermediate` \| `advanced` | `200 { basedOn, total, recommendations }`; `400` invalid query |
| GET | `/recommendations/projects/:id` ✅ | JWT | – | `200 { project }`; `404` unknown id |
| GET | `/recommendations/internships` | JWT | – | `501` (planned) |

Each recommendation has the form `{ project, match }`, where `match` contains:
- `score`
- `practisesMissingSkills`
- `usesYourSkills`
- `readyPercentage` (how many of the project's skills the student already has)

**Ranking rule:**
- `score = 3 × missing skills practised + skills already known − unrelated skills`.
- Projects that don't practise any missing skill are left out.
- A student without a career goal gets projects that build on the skills they already have.

### Interview preparation (M8)

| Method | Endpoint | Auth | Success |
|---|---|---|---|
| GET | `/interview/questions` | JWT | `501` (planned) |
| POST | `/interview/answers` | JWT | `501` (planned) |

### AI service (internal, called only by the backend)

| Method | Endpoint | Used by |
|---|---|---|
| GET | `/health` ✅ | `GET /api/health` |
| POST | `/resume/analyze` ✅ | resume upload: extracts text from the PDF and detects skills |
| POST | `/skills/normalize` ✅ | profile update: standard skill names |
| POST | `/roadmap/generate`, `/interview/evaluate` | planned (LLM) |

## Testing the API

| Tool | How |
|---|---|
| **Automated tests** | `cd backend && npm test`. 71 tests; each test file uses its own temporary database. |
| **End-to-end check** | Start the server (`npm start`), then run `npm run api:check`. It makes 41 requests (valid and invalid) against the running server with a temporary student, compares each status code with the expected one, and deletes the student afterwards. |
| **Postman / Thunder Client** | Import [`docs/api/SkillSync.postman_collection.json`](api/SkillSync.postman_collection.json) and run the folders from top to bottom. The Register/Login requests save the JWT in `{{token}}` automatically, and every request has a status-code test. |
| **cURL** | e.g. `curl http://localhost:5000/api/dashboard -H "Authorization: Bearer <token>"` |
| **Browser DevTools** | Network tab on any page: shows each request, its status and its JSON response. |

The backend terminal logs one line per request (time, method, path, status, duration). Request
bodies are never logged, so passwords and tokens never appear in the logs.
