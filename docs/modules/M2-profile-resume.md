# Module M2 – Profile & Resume (connected to M3 – Resume Analyzer)

**Status:** Complete (Phase 1, Day 6)
**Requirements covered:** FR-04 (edit profile), FR-05 (add/remove skills), FR-06 (upload PDF resume),
FR-07 (detect skills from the resume and let the student confirm them), NFR-03 (file safety),
NFR-06 (reliability), NFR-09 (privacy)

## What it does

- The student edits their **name, university, degree, graduation year and career interests**.
- The student **adds and removes skills** (duplicates are ignored, case-insensitive).
- The student **uploads a PDF resume** (max 2 MB). The backend sends it to the **Python AI service**,
  which reads the text and detects skills.
- New detected skills are shown as suggestions; the student **chooses which ones to add**.
- The student can **download** or **delete** their resume.
- The **dashboard** shows the live profile: education, skills, checklist progress.

## How the features are connected

```
Profile page (Next.js)
   │  PUT /api/profile                 POST /api/profile/resume (multipart PDF)
   ▼                                        ▼
Express backend ── requireAuth (M1) ── profile.controller.js
   │                                        │ 1. check size (≤ 2 MB) and real PDF content ("%PDF-")
   │                                        │ 2. aiClient.analyzeResume()  ──►  FastAPI /resume/analyze (M3)
   │                                        │                                   pdfplumber + skill matcher
   │                                        │ 3. save file to uploads/ (Git-ignored)
   ▼                                        ▼
MongoDB: User { university, degree, graduationYear, interests, skills, resume{...} }
   │
   └──► AuthContext.updateUser() ──► Navbar, Profile cards and Dashboard update instantly
```

If the AI service is down, the resume is still saved and the student sees a friendly message (NFR-06).

## API

| Method | Endpoint | Body | Result |
|--------|----------|------|--------|
| GET | `/api/profile` | – | `{ user }` |
| PUT | `/api/profile` | any of `name, university, degree, graduationYear, skills, interests` | `{ user }` (partial update) |
| POST | `/api/profile/resume` | multipart field `resume` (PDF) | `{ analysis, detectedSkills, newSkills, user }` |
| GET | `/api/profile/resume` | – | downloads your own PDF |
| DELETE | `/api/profile/resume` | – | deletes the file and resume data |

All routes require a valid JWT. Email and password cannot be changed through `/api/profile`.

## Files

| File | Responsibility |
|------|----------------|
| `backend/src/routes/profile.routes.js` | Profile endpoints, all protected by `requireAuth` |
| `backend/src/controllers/profile.controller.js` | Update profile, upload/download/delete resume |
| `backend/src/middleware/upload.middleware.js` | Multer: one file, PDF only, max 2 MB, kept in memory until checked |
| `backend/src/services/resumeStorage.js` | Saves files with random names in `uploads/resumes` |
| `backend/src/services/aiClient.js` | Sends the PDF to the AI service (15 s timeout) |
| `backend/src/utils/validators.js` | Profile validation, list cleaning (trim, de-duplicate) |
| `backend/src/models/User.js` | Profile fields, resume sub-document, `profileComplete` |
| `ai-service/app/services/resume_parser.py` | ~90 skills with aliases, whole-word matching |
| `ai-service/app/routers/resume.py` | `POST /resume/analyze`; 400 for unreadable PDFs |
| `frontend/src/app/profile/page.js` | Profile page with progress badges |
| `frontend/src/components/profile/*` | Details card, Skills card, Resume card (drag-and-drop, suggestions) |
| `frontend/src/components/ui/TagInput.js` | Reusable add/remove tag input |
| `frontend/src/app/dashboard/page.js` | Shows live profile data and checklist |

## Skill detection rules (AI service)

- Whole-word matching: "Java" is not found inside "JavaScript"; "SQL" is not found inside "NoSQL".
- Aliases map to one name: "NodeJS", "Node.js", "Node" → **Node.js**.
- Words that are also normal English are matched only in their technical spelling:
  "REST" but not "the rest of the team", "Excel" but not "I excel at", "Swift" but not "a swift learner".
- "React Native" does not also count as "React" unless React appears separately.

## Skill normalization (added Day 7)

Skills typed by hand are sent to `POST /skills/normalize` before saving, so they use the same
standard names as the resume analyzer: "Nextjs" → "Next.js", "javascript" → "JavaScript",
"FastApi" → "FastAPI", "Nestjs" → "NestJS". Duplicates are removed after mapping; unknown skills
are kept exactly as typed. If the AI service is not running, skills are saved as typed (3-second timeout).
Existing profiles were cleaned once with `backend/scripts/normalize-skills.js`.

## Testing

- `backend/tests/profile.test.js` – 18 tests (a fake AI service is started inside the test).
- `ai-service/tests/test_resume_parser.py` – 15 tests (detection + normalization).
- Manual end-to-end test with the real AI service: a sample resume returned 20 correct skills.
