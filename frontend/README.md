# Frontend (React + Vite)

UI for Agentic RAG workspace, chat, and evaluation.

## Requirements
- Node.js 18+ (recommended 20+)
- npm

## Setup

```powershell
cd frontend
npm install
```

## Run (Dev)

```powershell
npm run dev
```

Default URL:
- `http://localhost:5173`

## Build

```powershell
npm run build
```

## Preview Production Build

```powershell
npm run preview
```

## Backend Connection
Frontend expects backend API under `/api/v1` and typically runs with backend on:
- `http://localhost:8000`

If needed, adjust proxy/base config in Vite setup.
