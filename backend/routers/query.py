"""Query router — SSE streaming RAG query endpoint."""
from __future__ import annotations

import json

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from agents.rag_agent import stream_rag_response

router = APIRouter(prefix="/query", tags=["RAG Query"])

VALID_ROLES = {"engineer", "safety_officer", "field_tech"}


@router.get("", summary="Stream a RAG query response via SSE")
async def query_rag(
    q: str = Query(..., description="User question or query"),
    role: str = Query("engineer", description="User role: engineer | safety_officer | field_tech"),
    top_k: int = Query(5, ge=1, le=20, description="Number of context chunks to retrieve"),
    doc_type: str | None = Query(None, description="Filter retrieval to a specific doc type"),
) -> EventSourceResponse:
    """
    SSE streaming endpoint. Events emitted:
    - `citation` : JSON array of retrieved source citations
    - `token`    : individual streamed text token
    - `done`     : empty event signalling completion
    - `error`    : error message
    """
    if role not in VALID_ROLES:
        role = "engineer"

    async def event_generator():
        async for event in stream_rag_response(
            query=q,
            role=role,
            top_k=top_k,
            doc_type_filter=doc_type,
        ):
            event_type = event["type"]
            data = event["data"]
            if isinstance(data, (list, dict)):
                data = json.dumps(data)
            yield {"event": event_type, "data": data}

    return EventSourceResponse(event_generator())


@router.get("/sync", summary="Synchronous RAG query (non-streaming)")
async def query_rag_sync(
    q: str = Query(..., description="User question or query"),
    role: str = Query("engineer", description="User role"),
    top_k: int = Query(5, ge=1, le=20),
) -> JSONResponse:
    """
    Non-streaming RAG query — useful for testing and programmatic use.
    Returns full answer + citations in one response.
    """
    from agents.rag_agent import rag_query_sync
    if role not in VALID_ROLES:
        role = "engineer"
    result = rag_query_sync(q, role=role, top_k=top_k)
    return JSONResponse(content=result)
