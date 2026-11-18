from pydantic import BaseModel


class RoadmapRequest(BaseModel):
    target_role: str
    current_skills: list[str]
    missing_skills: list[str]
    weeks: int = 8
