# SkillSync

**AI-Powered Student Skill Development and Career Guidance Platform**

SkillSync helps students find the gap between their current skills and the skills needed for a
chosen career role, then gives them a personalized learning roadmap, project ideas, internship
suggestions and interview practice.

> UNAI TECH Virtual Internship Program 2026 - Domain: Full-Stack Web Development with AI Integration

## Architecture

SkillSync uses a simple **three-tier architecture** with a separate AI service:

![SkillSync architecture](docs/diagrams/architecture.png)

- **Frontend** (Next.js) is the only part the student sees. It talks only to the backend API.
- **Backend** (Express) handles authentication, business logic and the database. It calls the AI
  service when AI work is needed.
- **AI Service** (FastAPI) handles resume analysis and LLM tasks. Keeping it separate lets it use
  Python's AI libraries and change without touching the main API.
- **MongoDB Atlas** stores users, career roles and roadmaps. **Cloudinary** stores resume files.

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
| 4 | **Career & Skill Gap** | Career roles and their required skills; compares them with the student's skills | `backend/src/routes/career.routes.js`, `models/CareerRole.js`, `frontend/src/app/skill-gap` |
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
│       │   ├── login/  register/  dashboard/  profile/  skill-gap/  roadmap/
│       ├── components/
│       │   ├── layout/          Navbar and page layout parts
│       │   └── ui/              reusable UI elements (Button, ...)
│       └── lib/
│           └── api.js           helper for calling the backend API
│
├── backend/                     Node.js + Express REST API
│   ├── src/
│   │   ├── server.js            app entry point
│   │   ├── config/              database connection
│   │   ├── routes/              one file per module, combined in index.js
│   │   ├── controllers/         request handling logic
│   │   ├── middleware/          JWT auth, error handling
│   │   ├── models/              Mongoose schemas (User, CareerRole, Roadmap)
│   │   ├── services/            calls to external services (AI service)
│   │   └── utils/               small shared helpers
│   └── tests/                   API tests
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
├── docs/                        diagrams and planning documents
├── .gitignore
└── README.md
```

## API Endpoints (planned)

Endpoints marked ✅ work now; the others return `501 Not Implemented` until their module is built.

| Method | Endpoint | Module | Auth |
|--------|----------|--------|------|
| GET | `/api/health` ✅ | System | – |
| POST | `/api/auth/register` | Authentication | – |
| POST | `/api/auth/login` | Authentication | – |
| GET / PUT | `/api/profile` | Profile | JWT |
| POST | `/api/profile/resume` | Profile & Resume | JWT |
| GET | `/api/career/roles` | Career | – |
| GET | `/api/career/skill-gap` | Skill Gap | JWT |
| GET / POST | `/api/career/roadmap` | Roadmap | JWT |
| PATCH | `/api/career/roadmap/tasks/:taskId` | Roadmap | JWT |
| GET | `/api/recommendations/projects` | Recommendations | JWT |
| GET | `/api/recommendations/internships` | Recommendations | JWT |
| GET | `/api/interview/questions` | Interview | JWT |
| POST | `/api/interview/answers` | Interview | JWT |

AI service (internal, called by the backend): `GET /health` ✅, `POST /resume/analyze` ✅,
`POST /roadmap/generate`, `POST /interview/evaluate`.

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

**Prerequisites:** Node.js 20+, Python 3.10+, Git

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
cd ai-service
pytest
```

## Environment Variables

Real `.env` files are **not committed**. Copy each `.env.example` to `.env` (or `.env.local` for
the frontend) and add your own values.

## Project Progress

- [x] Phase 1 Day 1: Development environment setup
- [x] Phase 1 Day 2: Git & GitHub version control
- [x] Phase 1 Day 3: Project structure, modules and architecture
- [x] Phase 1 Day 4: Requirements analysis and module planning
- [ ] Database setup (MongoDB Atlas)
- [ ] User authentication
