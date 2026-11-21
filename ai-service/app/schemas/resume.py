from pydantic import BaseModel


class ResumeAnalysis(BaseModel):
    """Result of analysing a resume."""
    skills: list[str]
    word_count: int = 0
