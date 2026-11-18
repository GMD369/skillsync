from pydantic import BaseModel


class ResumeAnalysis(BaseModel):
    """Result of analysing a resume."""
    skills: list[str]
    strengths: list[str] = []
    weaknesses: list[str] = []
