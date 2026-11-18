from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from app.routers import interview, resume, roadmap  # noqa: E402

app = FastAPI(title="SkillSync AI Service", version="0.1.0")

app.include_router(resume.router)
app.include_router(roadmap.router)
app.include_router(interview.router)


@app.get("/health")
def health():
    """Quick check that the AI service is running."""
    return {"status": "ok", "service": "skillsync-ai-service"}
