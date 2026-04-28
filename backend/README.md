# Backend (FastAPI)

Backend for Agentic RAG: ingestion, retrieval, chat orchestration, and evaluation.

## Requirements
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) installed

## Setup

```powershell
cd backend
uv sync
```

## Environment
1. Copy env template:
```powershell
Copy-Item .env.example .env
```
2. Update `.env` values.

### Required keys
- `COHERE_API_KEY` (for evaluation)

### Common config
- `HOST=0.0.0.0`
- `PORT=8000`
- `LLM_MODEL=...` (chat model)
- `EVALUATION_MODEL=c4ai-aya-expanse-32b`

## Run

```powershell
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:
```powershell
curl http://localhost:8000/health
```

## Useful API Endpoints
- `POST /api/v1/ingest/file`
- `POST /api/v1/ingest/url`
- `POST /api/v1/agent/chat` (SSE)
- `POST /api/v1/eval/run/{session_id}`
- `GET /api/v1/eval/{session_id}`
- `POST /api/v1/admin/index/build`

## Notes
- Local DB/index files are under `backend/data/` (git-ignored).
- Logs are under `backend/logs/` (git-ignored).
