from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)            # position in document
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)            # cached token count
    metadata_json = Column(JSON, nullable=True)              # {"page": 1, "heading": "Intro"}
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    document = relationship("Document", back_populates="chunks")
    indexed = Column(Integer, default=0, nullable=False)  # 0 = not indexed, 1 = indexed
