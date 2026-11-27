# Frontend ↔ Backend Integration

This document explains how the SkillSync frontend (Next.js) talks to the backend (Express + MongoDB)
and the AI service. It also covers how the app handles loading, errors, empty data and repeated
clicks, and how the complete workflow is tested in a real browser.

## 1. Configuration

| Setting | Where | Value (local) |
|---|---|---|
| API base URL | `frontend/.env.local` → `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |
| Allowed frontend origin (CORS) | `backend/.env` → `CLIENT_URL` | `http://localhost:3000` |
| AI service URL (backend only) | `backend/.env` → `AI_SERVICE_URL` | `http://localhost:8000` |

The browser only talks to the backend. The AI service is never called from the browser. Only the
`.env.example` files are committed.

## 2. How a request travels

```text
Page / component ── apiRequest(path, { method, body, token }) ── lib/api.js
   │                     adds JSON headers + "Authorization: Bearer <JWT>", 15 s timeout (30 s for uploads)
   ▼
Express API ── requireAuth (JWT) → validation → controller → Mongoose → MongoDB
   │                                                  └──→ AI service (resume analysis, skill names)
   ▼
JSON response ── ok: data returned to the page │ error: ApiError(message, status, field errors)
```

- `frontend/src/lib/api.js` is the **only** place that calls `fetch`. Every page uses `apiRequest()`, so
  headers, timeouts and error handling are the same everywhere.
- `frontend/src/context/AuthContext.js` keeps the logged-in user and token. It saves the token in
  `localStorage`, restores it on page load (`GET /auth/me`), and logs out automatically on a 401.

## 3. Pages and the endpoints they use

| Page / component | User action | Method + endpoint | Result shown |
|---|---|---|---|
| Register | submit the form | `POST /auth/register` | logged in, redirected to the dashboard |
| Login | submit the form | `POST /auth/login` | logged in, redirected to the dashboard |
| (every page load) | – | `GET /auth/me` | restores the saved login |
| Dashboard | open | `GET /dashboard` | readiness %, roadmap week, checklist |
| Profile – details / skills | save | `PUT /profile` | "Profile saved." / normalized skills |
| Profile – resume | upload / download / delete | `POST`, `GET`, `DELETE /profile/resume` | detected skills to add |
| Profile – delete account | confirm with password | `DELETE /profile` | logged out, all data removed |
| Skill Gap | open / choose a role | `GET /career/roles`, `PUT /career/target-role`, `GET /career/skill-gap` | match % and per-skill status |
| Roadmap | create / tick / delete | `POST`, `GET`, `PATCH .../tasks/:id`, `DELETE /career/roadmap` | weeks, tasks and progress |
| Projects | open / filter by level | `GET /recommendations/projects?level=&limit=` | ranked project cards |

## 4. Complete workflow example: registration

1. The student fills in the **register form**.
2. The **frontend validates** the input with the same rules as the backend (`lib/validators.js`): name of
   at least 2 characters, a valid e-mail, a password of 8–72 bytes with a letter and a number, and
   matching passwords. Errors are shown under each field, and **no request is sent**.
3. The frontend sends `POST /api/auth/register`. The button shows "Creating account..." and is disabled.
4. The **backend validates again** (client checks can be bypassed), hashes the password with bcrypt and
   **stores the user in MongoDB**. A duplicate e-mail returns `409`.
5. The backend returns `201 { token, user }`. The frontend saves the token and opens the **dashboard**,
   which loads `GET /api/dashboard` and shows "Welcome, <name>!" and "1 of 5 done".

The same pattern (validate → send → backend validates and stores → show the result) is used for the
profile, resume, career goal and roadmap.

## 5. Loading, errors, empty data and duplicate submissions

| Situation | How the app handles it |
|---|---|
| **Loading** | Buttons show a spinner and text such as "Saving..." or "Analyzing...". Pages show "Loading..." (with `role="status"`), and stat cards show "…". Changing the project filter dims the old cards and shows "Updating...". |
| **Invalid input** | Checked in the browser first; the server's field errors (`errors`) are shown next to the matching inputs. |
| **Server error / unreachable / slow** | `api.js` turns every failure into a readable message: "Cannot reach the server...", "The server is taking too long...", or "The server had a problem..." for a 5xx without a message. A request is cancelled after 15 s (30 s for uploads), so a page never loads forever. |
| **Failed page data** | Dashboard, Skill Gap, Roadmap and Projects show the error with a **Try again** button (`components/ui/LoadError.js`), which repeats the request without reloading the page. If older data is still on screen, the message says that the last loaded values are shown. |
| **Server down when the app opens** | The saved login is **kept**, and a "Can't connect to SkillSync" screen with Try again is shown. Only a 401 removes the token. Before Day 11, a network problem logged the student out. |
| **Expired login** | Any 401 logs the student out and returns them to the login page. |
| **Empty data** | "No roadmap yet" with a create button (a 404 from `GET /career/roadmap` is treated as empty, not as an error), "No matching projects", "No skills yet.", and "No career roles are available" only when the request succeeded but the list is empty. |
| **Duplicate submissions** | Buttons are disabled while a request is running. `lib/useSubmitLock.js` also ignores a second call until the first one finishes, on every form (register, login, profile, skills, resume, career goal, delete account) and on the roadmap. On the roadmap only one change runs at a time. Otherwise, two quick task clicks could finish in the wrong order and show old progress. |
| **Stale responses** | Each data-loading effect ignores responses that arrive after the user has left the page or changed the filter (`active` flag). |

## 6. End-to-end test in a real browser

`frontend/e2e/workflow.mjs` runs the whole workflow in Microsoft Edge (or Chrome) through the Chrome
DevTools Protocol (`e2e/cdp.mjs`). It needs **no extra npm packages**. It types and clicks like a user
and checks two things at each step: what the page shows, **and** what the backend returns for the same
data. This proves the data really reached MongoDB.

```bash
# backend, AI service and frontend running
cd frontend
npm run test:e2e                      # 16 steps, prints PASS/FAIL
SHOTS=e2e/output npm run test:e2e     # also saves a screenshot per step and the list of API requests
```

| # | Step | Checks |
|---|---|---|
| 1 | Register with an empty form | field errors shown, **0** requests sent |
| 2 | Register (double-click) | **1** request, account in the database, dashboard "1 of 5 done" |
| 3–4 | Profile details and skills | saved in the database; "nodejs" stored as "Node.js" (AI service) |
| 5–6 | Resume | non-PDF rejected in the browser; PDF → AI detects skills → added to the profile |
| 7 | Skill gap | Full-Stack Developer saved; page % = API % |
| 8 | Roadmap | created, one task ticked, progress saved |
| 9–10 | Dashboard, Projects | same numbers as the API; level filter calls the API |
| 11–13 | Failure simulation | server unreachable, HTTP 500, and backend down on page load: clear messages, Try again recovers, login kept |
| 14–15 | Logout / login | duplicate e-mail (409) and wrong password (401) messages; correct login works |
| 16 | Delete account | through the UI; the old password no longer logs in |

The test creates its own student (`e2e-<time>@example.com`) and deletes it at the end. If a step
fails, the account is still removed through the API, so no test data is left behind.
