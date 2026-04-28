from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime
from app.core.database import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    context = Column(JSON, nullable=True)               # list of chunk texts
    tool_outputs = Column(JSON, nullable=True)
    faithfulness = Column(Float, nullable=True)
    answer_relevancy = Column(Float, nullable=True)
    context_precision = Column(Float, nullable=True)
    metrics_json = Column(JSON, nullable=True)           # full DeepEval output
    created_at = Column(DateTime, default=datetime.utcnow)
