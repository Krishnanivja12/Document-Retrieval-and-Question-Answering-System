from fastapi import FastAPI
from app.core.config import settings
from app.core.events import lifespan
from app.core.errors import register_exception_handlers
from app.core.database import engine, Base
from app.api.routes.ingestion import router as ingestion_router
from app.models import document, chunk, evaluation  # noqa
from app.api.routes.admin import router as admin_router
from app.api.routes.search import router as search_router
from app.api.routes.query import router as query_router
from app.api.routes.agent import router as agent_router
from app.api.routes.evaluation import router as eval_router
from app.core.middleware import setup_middleware


app = FastAPI(
    title="Agentic RAG API",
    version="0.1.0",
    lifespan=lifespan,
)

setup_middleware(app)
register_exception_handlers(app)

# Include routers
app.include_router(ingestion_router)
app.include_router(admin_router)
app.include_router(search_router)
app.include_router(query_router)
app.include_router(agent_router)
app.include_router(eval_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "Welcome to the Agentic RAG API"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENV}
