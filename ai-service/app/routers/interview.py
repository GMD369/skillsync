from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/interview", tags=["Interview Preparation"])


@router.post("/evaluate")
def evaluate_answer():
    """Will score a typed interview answer and suggest improvements."""
    raise HTTPException(status_code=501, detail="Interview evaluation is planned but not implemented yet")
