"""
AURA — Asset Understanding & Response AI
FastAPI Application Entry Point

Endpoints:
  POST /ingest                 — Upload PDF or TXT documents
  GET  /ingest/docs            — List ingested documents
  GET  /query?q=...            — SSE streaming RAG query
  GET  /query/sync?q=...       — Synchronous RAG query
  POST /compliance-check       — Compliance gap analysis
  POST /rca                    — Root Cause Analysis
  GET  /risk-pulse             — Current risk alerts
  POST /risk-pulse/demo        — Inject demo alerts
  POST /audit-pack             — Generate audit pack (JSON + DOCX)
  GET  /audit-pack/download/{fn} — Download DOCX
  GET  /graph                  — D3 knowledge graph JSON
  GET  /health                 — Health check
"""
from __future__ import annotations

import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Validate config before anything else
# ---------------------------------------------------------------------------
from config import settings

try:
    settings.validate()
except ValueError as exc:
    print(f"\n[AURA] ❌ Configuration error: {exc}\n")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Import all routers
# ---------------------------------------------------------------------------
from routers.ingest import router as ingest_router
from routers.query import router as query_router
from routers.compliance import router as compliance_router
from routers.rca import router as rca_router
from routers.risk_pulse import router as risk_pulse_router
from routers.audit import router as audit_router
from routers.graph import router as graph_router

# ---------------------------------------------------------------------------
# Background task management
# ---------------------------------------------------------------------------
from agents.risk_pulse import start_background_task, stop_background_task, inject_demo_alerts


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: start risk pulse. Shutdown: stop it cleanly."""
    print("[AURA] Starting up...")
    start_background_task()

    # Inject demo alerts immediately so the /risk-pulse endpoint has data
    inject_demo_alerts()
    print("[AURA] Demo alerts pre-loaded. Risk pulse background task running.")

    yield

    print("[AURA] Shutting down...")
    stop_background_task()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AURA — Asset Understanding & Response AI",
    description=(
        "AI-powered document intelligence for industrial plants. "
        "Ingest SOPs, PTWs, incident logs, and maintenance records. "
        "Query in plain language, detect compliance gaps, run RCA, and get proactive risk alerts."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for local dev / demo
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------
app.include_router(ingest_router)
app.include_router(query_router)
app.include_router(compliance_router)
app.include_router(rca_router)
app.include_router(risk_pulse_router)
app.include_router(audit_router)
app.include_router(graph_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"], summary="Health check")
async def health() -> JSONResponse:
    from ingestion.vector_store import collection_count

    return JSONResponse(
        content={
            "status": "ok",
            "service": "AURA Backend",
            "version": "1.0.0",
            "model": settings.GEMINI_MODEL,
            "chunks_in_db": collection_count("documents"),
        }
    )


@app.get("/", tags=["System"], summary="Root — API info")
async def root() -> JSONResponse:
    return JSONResponse(
        content={
            "service": "AURA — Asset Understanding & Response AI",
            "version": "1.0.0",
            "docs": "/docs",
            "endpoints": {
                "ingest": "POST /ingest",
                "docs_list": "GET /ingest/docs",
                "query_stream": "GET /query?q=<your question>&role=engineer",
                "query_sync": "GET /query/sync?q=<your question>",
                "compliance": "POST /compliance-check",
                "rca": "POST /rca",
                "risk_pulse": "GET /risk-pulse",
                "audit": "POST /audit-pack",
                "graph": "GET /graph",
                "health": "GET /health",
            },
        }
    )


# ---------------------------------------------------------------------------
# Entry point (for direct python execution)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info",
    )
