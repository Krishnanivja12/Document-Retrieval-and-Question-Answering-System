import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.retrieval_service import hybrid_search
from app.services.generation_service import generate_answer, build_context_string
from loguru import logger

router = APIRouter(prefix="/api/v1/ask", tags=["ask"])

class AskRequest(BaseModel):
    question: str
    top_k: int = 5
    filters: Optional[dict] = None
    stream: bool = False

async def response_generator(question: str, context_strs: list[str]):
    """Async generator that yields SSE formatted tokens."""
    try:
        async for token in generate_answer(question, context_strs, stream=True):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@router.post("")
async def ask_question(request: AskRequest, db: Session = Depends(get_db)):
    """RAG ask endpoint with optional streaming."""
    try:
        # Retrieve chunks
        chunks = hybrid_search(
            query=request.question,
            top_k=request.top_k,
            filters=request.filters,
            db=db,
        )
        if not chunks:
            if request.stream:
                return StreamingResponse(
                    content=iter([f"data: {json.dumps({'token': 'No relevant information found.'})}\n\n",
                                  "data: [DONE]\n\n"]),
                    media_type="text/event-stream"
                )
            else:
                return {"answer": "No relevant information found.", "sources": []}

        context_strs = build_context_string(chunks)

        if request.stream:
            # Return SSE stream
            return StreamingResponse(
                content=response_generator(request.question, context_strs),
                media_type="text/event-stream"
            )
        else:
            # Collect full response
            full_answer = ""
            async for token in generate_answer(request.question, context_strs, stream=False):
                full_answer = token  # only one chunk
            return {
                "answer": full_answer,
                "sources": [
                    {
                        "chunk_id": chunk["chunk_id"],
                        "document_id": chunk["document_id"],
                        "content_snippet": chunk["content"][:200] + "..." if chunk["content"] else ""
                    }
                    for chunk in chunks
                ]
            }
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in /ask: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
