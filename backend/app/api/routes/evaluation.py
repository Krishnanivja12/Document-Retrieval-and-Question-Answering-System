from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.evaluation_service import EvaluationServiceError, evaluate_session
from app.models.evaluation import Evaluation
from loguru import logger

router = APIRouter(prefix="/api/v1/eval", tags=["evaluation"])

@router.post("/run/{session_id}")
async def run_evaluation(session_id: str, db: Session = Depends(get_db)):
    try:
        eval_record = evaluate_session(session_id, db)
        return {
            "session_id": session_id,
            "faithfulness": eval_record.faithfulness,
            "answer_relevancy": eval_record.answer_relevancy,
            "context_precision": eval_record.context_precision,
        }
    except EvaluationServiceError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail={"message": str(e), "code": e.error_code},
        )
    except Exception as e:
        logger.error(f"DeepEval API error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Evaluation failed", "code": "evaluation_internal_error"},
        )

@router.get("/{session_id}")
async def get_evaluation(session_id: str, db: Session = Depends(get_db)):
    latest = (
        db.query(Evaluation)
        .filter(Evaluation.session_id == session_id)
        .order_by(Evaluation.created_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="No evaluation found for session")
    return {
        "session_id": latest.session_id,
        "question": latest.question,
        "answer": latest.answer,
        "faithfulness": latest.faithfulness,
        "answer_relevancy": latest.answer_relevancy,
        "context_precision": latest.context_precision,
        "created_at": latest.created_at.isoformat(),
    }
