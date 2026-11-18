from fastapi import APIRouter, HTTPException

from app.schemas.roadmap import RoadmapRequest

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap"])


@router.post("/generate")
def generate_roadmap(request: RoadmapRequest):
    """Will use the LLM to build a week-by-week plan for the missing skills."""
    raise HTTPException(status_code=501, detail="Roadmap generation is planned but not implemented yet")
