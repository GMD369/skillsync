from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.resume_parser import normalize_skills

router = APIRouter(prefix="/skills", tags=["Skills"])


class SkillList(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=100)


@router.post("/normalize", response_model=SkillList)
def normalize(body: SkillList):
    """Convert typed skills to standard names and remove duplicates.

    Example: ["Nextjs", "Next.js", "javascript"] -> ["Next.js", "JavaScript"]
    """
    return SkillList(skills=normalize_skills(body.skills))
