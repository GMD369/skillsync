from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SkillSync AI Service", version="0.1.0")


@app.get("/health")
def health():
    """Quick check that the AI service is running."""
    return {"status": "ok", "service": "skillsync-ai-service"}
