# SkillSync

**AI-Powered Student Skill Development and Career Guidance Platform**

SkillSync helps students find the gap between their current skills and the skills needed for a
chosen career role, then gives them a personalized learning roadmap, project ideas, internship
suggestions and interview practice.

> UNAI TECH Virtual Internship Program 2026 - Domain: Full-Stack Web Development with AI Integration

## Current Status

| Module | Status |
|--------|--------|
| **M1 – Authentication** | ✅ Register, login, logout, JWT-protected pages, brute-force protection ([docs](docs/modules/M1-authentication.md)) |
| **M2 – Profile & Resume** | ✅ Education details, skills, PDF resume upload / download / delete ([docs](docs/modules/M2-profile-resume.md)) |
| **M3 – Resume Analyzer (AI)** | ✅ First version: detects ~90 skills from resume text and normalizes typed skills ("Nextjs" → "Next.js"), connected to M2 |
| **M4 – Career & Skill Gap** | ✅ Five seeded roles, target-role selection, skill comparison and match percentage ([docs](docs/modules/M4-career-skill-gap.md)) |
| **M5 – Learning Roadmap** | 🟡 Database layer done: create / read / update tasks / delete, progress tracking ([docs](docs/modules/M5-learning-roadmap.md)); tasks come from templates – AI generation is next |
| **M6 – Progress Dashboard** | 🟡 One summary API (`GET /api/dashboard`): readiness, current roadmap week, next task, checklist ([docs](docs/modules/M6-progress-dashboard.md)); progress chart still to do |
| **M7 – Recommendations** | 🟡 Project ideas ranked by the skills you are missing ([docs](docs/modules/M7-recommendations.md)); internships planned |
| M8 – Interview Prep | ⏳ Planned (Should Have) |

**Tests:** 71 backend API tests + 15 AI service tests, all passing. `npm run api:check` tests all endpoints against the running server (41 checks).
**API:** 21 working endpoints – full reference in **[docs/API.md](docs/API.md)**, Postman collection in [docs/api/](docs/api/SkillSync.postman_collection.json).
**Database:** MongoDB with 4 collections (`users`, `careerroles`, `roadmaps`, `projects`) – see **[docs/DATABASE.md](docs/DATABASE.md)**.

### Known limitations (honest status)

- Resumes are stored on the server's disk; deployment will need cloud storage (e.g. Cloudinary).
- The login token is kept in `localStorage`; an HTTP-only cookie would be more secure in production.
- The login rate limiter is in memory, so it resets when the server restarts.
- Skill detection uses keyword rules, not an LLM yet; scanned (image-only) resumes cannot be read.
- Roadmap tasks are generic templates per skill; personalized AI tasks with resources are not built yet.
- The app runs locally only; it has not been deployed yet.

## Architecture

SkillSync uses a simple **three-tier architecture** with a separate AI service:

![SkillSync architecture](docs/diagrams/architecture.png)

- **Frontend** (Next.js) is the only part the student sees. It talks only to the backend API.
- **Backend** (Express) handles authentication, business logic and the database. It calls the AI
  service when AI work is needed.
- **AI Service** (FastAPI) handles resume analysis and LLM tasks. Keeping it separate lets it use
  Python's AI libraries and change without touching the main API.
- **MongoDB Atlas** stores users, career roles, roadmaps and project ideas. **Cloudinary** stores resume files.

### Database

![SkillSync database schema](docs/diagrams/database.png)

MongoDB (local in development, Atlas for deployment) with four collections: **users** (account,
profile, embedded resume details), **careerroles** (required skills per role), **roadmaps** (weekly
plan with tasks) and **projects** (portfolio ideas with skills, added on Day 10). Collections are linked by `ObjectId` references; unique indexes on `users.email`,
`careerroles.title` and `roadmaps.user`. Full design, field types and CRUD operations:
[docs/DATABASE.md](docs/DATABASE.md).

### User Workflow

![SkillSync workflow](docs/diagrams/workflow.png)

| Input | Process | Output |
|-------|---------|--------|
| Account details (name, email, password) | Validate, hash password, issue JWT | Logged-in student |
| Resume PDF and manually entered skills | Extract text, detect skills (pdfplumber + spaCy) | List of current skills |
| Target career role | Compare current skills with the role's required skills | Skill gap: done / in progress / missing |
| Missing skills | LLM builds a week-by-week plan | Personalized learning roadmap |
| Completed tasks, interview answers | Update progress, evaluate answers with LLM | Readiness score, feedback, recommendations |

## Requirements

The full requirements specification is in **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)**:
15 functional and 9 non-functional requirements, user requirements, 11 features
(input → processing → output), module dependencies, MoSCoW priorities and a 41-task development list.

| Priority | Features |
|----------|----------|
| **Must Have** (MVP) | Registration & Login, Student Profile & Resume Upload, Resume Analyzer, Career Role Selection & Skill Gap Analysis, Learning Roadmap, Progress Dashboard |
| **Should Have** | Project Recommendations, Internship Recommendations, AI Interview Preparation |
| **Could Have** | AI Career Assistant (chat), Google OAuth login, Email reminders and dark mode |

### Module Dependencies

![Module dependencies](docs/diagrams/dependencies.png)

An arrow from A to B means B needs A first. Critical path: **M1 → M2 → M4 → M5 → M6**.

## Modules

| # | Module | Responsibility | Where |
|---|--------|----------------|-------|
| 1 | **Authentication** | Register, login, password hashing, JWT tokens, protecting private routes | `backend/src/routes/auth.routes.js`, `middleware/auth.middleware.js`, `frontend/src/app/login`, `register` |
| 2 | **Profile & Resume** | Student details and skills, resume upload, sending the resume for analysis | `backend/src/routes/profile.routes.js`, `models/User.js`, `frontend/src/app/profile` |
| 3 | **Resume Analyzer (AI)** | Reads PDF text and detects skills | `ai-service/app/routers/resume.py`, `services/resume_parser.py` |
| 4 | **Career & Skill Gap** | Career roles and their required skills; compares them with the student's skills | `backend/src/controllers/career.controller.js`, `models/CareerRole.js`, `frontend/src/app/skill-gap` |
| 5 | **Learning Roadmap (AI)** | Generates and stores a weekly plan; students tick off tasks | `career.routes.js`, `models/Roadmap.js`, `ai-service/app/routers/roadmap.py`, `frontend/src/app/roadmap` |
| 6 | **Recommendations** | Suggests portfolio projects and matching internships | `backend/src/routes/recommendation.routes.js` |
| 7 | **Interview Preparation (AI)** | Role-based questions and AI feedback on answers | `backend/src/routes/interview.routes.js`, `ai-service/app/routers/interview.py` |
| 8 | **Progress Dashboard** | Career readiness score, completed skills, roadmap progress | `frontend/src/app/dashboard` |

## Project Structure

```
skillsync/
├── frontend/                    Next.js + React + Tailwind CSS
│   ├── public/                  static assets (images, icons)
│   └── src/
│       ├── app/                 pages (App Router: one folder = one route)
│       │   ├── page.js          landing page
│       │   ├── layout.js        shared layout with navbar
│       │   ├── login/  register/  dashboard/  profile/  skill-gap/  roadmap/  projects/
│       ├── components/
│       │   ├── layout/          Navbar and page layout parts
│       │   └── ui/              reusable UI elements (Button, ...)
│       └── lib/
│           └── api.js           helper for calling the backend API
│
├── backend/                     Node.js + Express REST API
│   ├── src/
│   │   ├── server.js            entry point: loads .env, connects to MongoDB, starts the server
│   │   ├── app.js               Express app: logger → CORS → JSON parser → /api routes → 404 → error handler
│   │   ├── config/db.js         database connection
│   │   ├── routes/              one file per module (auth, profile, career, dashboard, recommendations, ...)
│   │   ├── controllers/         request handling: validate → database → JSON response
│   │   ├── middleware/          JWT auth, login rate limit, PDF upload, request logger, errors
│   │   ├── models/              Mongoose schemas: User, CareerRole, Roadmap, Project
│   │   ├── services/            skill gap, project ranking, AI-service client, resume storage
│   │   ├── data/                seed data (project ideas)
│   │   └── utils/               validators, JWT helper
│   ├── scripts/                 seed, database and API-check scripts
│   └── tests/                   API tests (node:test, 71 tests)
│
├── ai-service/                  Python + FastAPI
│   ├── app/
│   │   ├── main.py              app entry point
│   │   ├── routers/             endpoints: resume, roadmap, interview
│   │   ├── services/            resume parser, LLM client
│   │   └── schemas/             request/response models (Pydantic)
│   ├── tests/                   pytest tests
│   └── requirements.txt
│
├── docs/                        API reference, database design, module docs, diagrams, Postman collection
├── .gitignore
└── README.md
```

## API Endpoints

Base URL `http://localhost:5000/api`. ✅ = working and tested; the others return `501 Not Implemented`
until their module is built. Request/response examples and status codes: **[docs/API.md](docs/API.md)**.

| Method | Endpoint | Module | Auth |
|--------|----------|--------|------|
| GET | `/api/health` ✅ (API, database and AI service status) | System | – |
| POST | `/api/auth/register` ✅ | Authentication | – |
| POST | `/api/auth/login` ✅ | Authentication | – |
| GET | `/api/auth/me` ✅ | Authentication | JWT |
| GET / PUT / DELETE | `/api/profile` ✅ (DELETE = delete account) | Profile | JWT |
| POST / GET / DELETE | `/api/profile/resume` ✅ | Profile & Resume | JWT |
| GET | `/api/career/roles` ✅ | Career | – |
| PUT | `/api/career/target-role` ✅ | Career | JWT |
| GET | `/api/career/skill-gap` ✅ | Skill Gap | JWT |
| GET / POST / DELETE | `/api/career/roadmap` ✅ | Roadmap | JWT |
| PATCH | `/api/career/roadmap/tasks/:taskId` ✅ | Roadmap | JWT |
| GET | `/api/dashboard` ✅ | Dashboard | JWT |
| GET | `/api/recommendations/projects` ✅ (`?level=`, `?limit=`) | Recommendations | JWT |
| GET | `/api/recommendations/projects/:id` ✅ | Recommendations | JWT |
| GET | `/api/recommendations/internships` | Recommendations | JWT |
| GET | `/api/interview/questions` | Interview | JWT |
| POST | `/api/interview/answers` | Interview | JWT |

**Testing the API:** `npm test` (automated), `npm run api:check` (all endpoints against the running
server), the [Postman collection](docs/api/SkillSync.postman_collection.json) (works in Postman and
Thunder Client), or cURL.

AI service (internal, called by the backend): `GET /health` ✅, `POST /resume/analyze` ✅,
`POST /skills/normalize` ✅, `POST /roadmap/generate`, `POST /interview/evaluate`.

## Development Sequence

Modules are built in order of dependency, with the core features first:

1. **Authentication**: every other module needs a logged-in user
2. **Profile & Resume upload**: the source of the student's skills
3. **Resume Analyzer**: automatic skill detection
4. **Career & Skill Gap**: seed career roles, then compare skills
5. **Learning Roadmap**: AI-generated plan for the missing skills
6. **Progress Dashboard**: readiness score from completed tasks (**MVP complete**)
7. **Recommendations**: projects and internships
8. **Interview Preparation**: AI mock interviews
9. **Testing and deployment**: Vercel and Render

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | Next.js, React.js, Tailwind CSS             |
| Backend    | Node.js, Express.js, Mongoose, JWT, bcrypt  |
| Database   | MongoDB Atlas                               |
| AI Service | Python, FastAPI, pdfplumber, spaCy, LangChain, LLM API |
| Storage    | Cloudinary (resume files)                   |
| Deployment | Vercel (frontend), Render (backend + AI)    |

## Getting Started

**Prerequisites:** Node.js 20+, Python 3.10+, Git, MongoDB (local install or a MongoDB Atlas connection string)

### 1. Frontend (http://localhost:3000)
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 2. Backend (http://localhost:5000)
```bash
cd backend
npm install
cp .env.example .env     # then fill in your own values
npm run dev
```
Check: http://localhost:5000/api/health

### 3. AI Service (http://localhost:8000)
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows  (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
Check: http://localhost:8000/health. Interactive API docs: http://localhost:8000/docs

### Run tests
```bash
cd backend && npm test        # 71 API tests: auth 15, profile 20, career 9, roadmap 13, dashboard 6, recommendations 8
cd backend && npm run api:check   # with the server running: 41 requests against every endpoint, then clean-up
cd ai-service && pytest       # skill detection and normalization tests (15)
```

### Maintenance scripts
```bash
cd backend
npm run seed:roles                 # insert/update the five approved career roles
npm run seed:projects              # insert/update the 21 portfolio project ideas (M7)
npm run db:overview                # show collections, counts, indexes and sample documents (secrets hidden)
npm run db:crud-demo               # Create / Read / Update / Delete on a temporary student, then clean up
node scripts/normalize-skills.js   # one-time: convert saved skills to standard names
node scripts/remove-old-fields.js  # one-time: remove unused fields from the first User schema
```

## Environment Variables

Real `.env` files are **not committed**. Copy each `.env.example` to `.env` (or `.env.local` for
the frontend) and add your own values.

## Project Progress

- [x] Phase 1 Day 1: Development environment setup
- [x] Phase 1 Day 2: Git & GitHub version control
- [x] Phase 1 Day 3: Project structure, modules and architecture
- [x] Phase 1 Day 4: Requirements analysis and module planning
- [x] Phase 1 Day 5: **M1 Authentication** - register, login, logout, JWT-protected dashboard (12 passing tests)
- [x] Phase 1 Day 6: **M1 improvements** (brute-force protection, 72-byte password limit, auto-logout) and **M2 Profile & Resume** connected to the **AI Resume Analyzer**
- [x] Phase 1 Day 7: Project review – skill normalization fix, repository clean-up, status and next-week plan
- [x] Phase 1 Day 8: **M4 Career & Skill Gap** – five career roles, goal selection, skill comparison, match percentage and dashboard integration
- [x] Phase 1 Day 9: **Database design & integration** – schema diagram, indexes and validation, roadmap CRUD (M5 data layer), account deletion with related data, database scripts and [documentation](docs/DATABASE.md)
- [x] Phase 1 Day 10: **Backend development & API integration** – dashboard summary API (M6), project recommendations API with a new `projects` collection (M7), request logging, AI-service health check, [API reference](docs/API.md), Postman collection and an end-to-end API check (71 tests, 41 live checks)

### Next week (Phase 1, week 2)

| Day | Goal |
|-----|------|
| 1 | Research required skills for the 5 career roles; seed script for `CareerRole` |
| 2 | `GET /api/career/roles`, role selection page, save target role |
| 3 | Skill-gap logic (done / missing, match %) with unit tests |
| 4 | Skill Gap results page; connect the readiness score to the dashboard |
| 5 | LLM prompt + `/roadmap/generate` (JSON output, validation, error handling) |
| 6 | Roadmap page with weekly tasks and progress saving |
| 7 | Testing, bug fixes, README and weekly review |

- [x] M4 Career roles & Skill Gap Analysis
- [x] M5 Learning Roadmap – database, API and page (template tasks)
- [ ] M5 AI roadmap generation (`/roadmap/generate` with an LLM)
