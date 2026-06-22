"""RCA router — Root Cause Analysis endpoint."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.rca_agent import run_rca

router = APIRouter(prefix="/rca", tags=["RCA"])


class RCARequest(BaseModel):
    incident: str = Field(
        ...,
        description="Free-text incident description",
        examples=["We had a gas detector miss last Tuesday near coke battery 3 — why?"],
    )
    top_k: int = Field(8, ge=1, le=20, description="Evidence chunks to retrieve")


@router.post("", summary="Run Root Cause Analysis for an incident")
async def root_cause_analysis(body: RCARequest) -> JSONResponse:
    """
    Perform multi-hop RCA using 5-Why and Fault Tree methodologies.

    Returns structured report with root cause, contributing factors,
    5-Why chain, fault tree, and prioritised recommendations.
    """
    result = run_rca(incident=body.incident, top_k=body.top_k)
    status = 200 if "error" not in result else 422
    return JSONResponse(content=result, status_code=status)
