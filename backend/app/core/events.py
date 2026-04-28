from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.ENV} environment on {settings.HOST}:{settings.PORT}")

    for dir_path in [
        Path(settings.FAISS_INDEX_PATH).parent,
        Path(settings.METADATA_DB_URL.replace("sqlite:///", "")).parent
        if settings.METADATA_DB_URL.startswith("sqlite")
        else Path("."),
        Path("logs"),
    ]:
        try:
            dir_path.mkdir(parents=True, exist_ok=True)
        except Exception as exc:
            logger.error(f"Failed to create directory {dir_path}: {exc}")

    from app.services.retrieval_service import build_bm25_index
    from app.services.vector_store_service import vector_store_service
    from app.core.database import Base, SessionLocal, engine

    Base.metadata.create_all(bind=engine)
    vector_store_service.load_or_create()
    logger.info("FAISS index loaded")

    db = SessionLocal()
    try:
        build_bm25_index(db)
    finally:
        db.close()

    try:
        yield
    finally:
        vector_store_service.save()
        logger.info("Shutting down, FAISS index saved")
