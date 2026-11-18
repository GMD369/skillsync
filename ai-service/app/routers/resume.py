from fastapi import APIRouter, UploadFile, File

from app.schemas.resume import ResumeAnalysis
from app.services.resume_parser import extract_text, find_skills

router = APIRouter(prefix="/resume", tags=["Resume Analyzer"])


@router.post("/analyze", response_model=ResumeAnalysis)
async def analyze_resume(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF resume and detect skills."""
    text = extract_text(file.file)
    return ResumeAnalysis(skills=find_skills(text))
