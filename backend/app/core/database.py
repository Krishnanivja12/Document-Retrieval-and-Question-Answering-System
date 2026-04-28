from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.core.config import settings

# For SQLite we disable check_same_thread to allow multiple threads (FastAPI)
engine = create_engine(
    settings.METADATA_DB_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.METADATA_DB_URL else {},
    echo=settings.SQL_ECHO,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Dependency to be used in routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
