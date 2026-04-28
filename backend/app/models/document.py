from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    source_type = Column(String(20), nullable=False)  # "file" or "url"
    source_url = Column(String(2048), nullable=True)
    content_type = Column(String(50), nullable=False)
    ext = Column(String(10), nullable=False)
    text_path = Column(String(500), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Integer, default=0)
    original_path = Column(String(500), nullable=True)

    chunks = relationship("Chunk", back_populates="document", order_by="Chunk.chunk_index")
