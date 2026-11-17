# SkillSync

**AI-Powered Student Skill Development and Career Guidance Platform**

SkillSync helps students find the gap between their current skills and the skills needed for a
chosen career role, then gives them a personalized learning roadmap, project ideas, internship
suggestions and interview practice.

> UNAI TECH Virtual Internship Program 2026 - Phase 1

## Project Structure

```
skillsync/
├── frontend/      Next.js + React + Tailwind CSS (user interface)
├── backend/       Node.js + Express.js REST API (auth, business logic, MongoDB)
│   └── src/
│       ├── config/        database connection
│       ├── controllers/   request handlers
│       ├── middleware/    auth and error handling
│       ├── models/        Mongoose schemas
│       └── routes/        API routes
├── ai-service/    Python + FastAPI (resume analysis, AI roadmaps)
│   └── app/
└── docs/          project documents
```

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | Next.js, React.js, Tailwind CSS         |
| Backend    | Node.js, Express.js, Mongoose, JWT      |
| Database   | MongoDB Atlas                           |
| AI Service | Python, FastAPI, pdfplumber, spaCy, LLM API |
| Deployment | Vercel (frontend), Render (backend + AI) |

## Prerequisites

- Node.js 20+ and npm
- Python 3.10+
- Git

## Getting Started

### 1. Frontend (http://localhost:3000)
```bash
cd frontend
npm install
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
Check: http://localhost:8000/health

## Environment Variables

Real `.env` files are **not committed**. Copy each `.env.example` to `.env` and add your own values.

## Project Progress

- [x] Phase 1 Day 1: Development environment setup
- [x] Phase 1 Day 2: Git & GitHub version control
- [ ] Database setup (MongoDB Atlas)
- [ ] User authentication