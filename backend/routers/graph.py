"""Graph router — D3 knowledge graph endpoint."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from graph.knowledge_graph import build_knowledge_graph

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


@router.get("", summary="Get D3-compatible knowledge graph JSON")
async def get_knowledge_graph() -> JSONResponse:
    """
    Build and return the knowledge graph from all ingested documents.

    Node types:
    - `equipment` (group 1, purple) — physical assets
    - `document`  (group 2, teal)   — SOPs, PTWs, manuals
    - `risk`      (group 3, amber)  — identified risk signals

    Edge relations: `references`, `mentions`, `has_risk`

    Compatible with D3.js `forceSimulation`.
    """
    graph = build_knowledge_graph()
    return JSONResponse(content=graph)
