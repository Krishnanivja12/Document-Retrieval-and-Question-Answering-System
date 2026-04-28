from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.retrieval_service import hybrid_search

router = APIRouter(prefix="/api/v1/search", tags=["search"])

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    filters: Optional[dict] = None   # e.g., {"document_id": 1, "page": 2}

class SearchResultItem(BaseModel):
    chunk_id: int
    content: Optional[str] = None
    score: float
    metadata: Optional[dict] = None
    document_id: int

@router.post("", response_model=list[SearchResultItem])
async def search(request: SearchRequest, db: Session = Depends(get_db)):
    try:
        results = hybrid_search(
            query=request.query,
            top_k=request.top_k,
            filters=request.filters,
            db=db,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
