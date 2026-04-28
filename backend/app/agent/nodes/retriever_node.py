from app.agent.state import AgentState
from app.services.retrieval_service import hybrid_search
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

def retriever_node(state: AgentState) -> AgentState:
    db: Session = SessionLocal()
    try:
        results = hybrid_search(
            query=state["question"],
            top_k=5,
            filters=None,
            db=db,
        )
        state["context"] = results
    finally:
        db.close()
    return state
