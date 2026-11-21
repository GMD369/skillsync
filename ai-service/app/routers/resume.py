from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.resume import ResumeAnalysis
from app.services.resume_parser import extract_text, find_skills

router = APIRouter(prefix="/resume", tags=["Resume Analyzer"])


@router.post("/analyze", response_model=ResumeAnalysis)
async def analyze_resume(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF resume and detect skills."""
    try:
        text = extract_text(file.file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not text.strip():
        # e.g. a scanned resume (image only) - no text layer to read
        return ResumeAnalysis(skills=[], word_count=0)
    return ResumeAnalysis(skills=find_skills(text), word_count=len(text.split()))
