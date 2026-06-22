"""Compliance router — compliance gap analysis endpoint."""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.compliance_agent import run_compliance_check

router = APIRouter(prefix="/compliance-check", tags=["Compliance"])


class ComplianceRequest(BaseModel):
    doc_name: str = Field(..., description="Filename or document identifier to check")
    doc_type: str | None = Field(None, description="Document type filter: SOP|PTW|etc.")
    top_k: int = Field(8, ge=1, le=20, description="Chunks to retrieve per side")


@router.post("", summary="Run compliance gap analysis on a document")
async def compliance_check(body: ComplianceRequest) -> JSONResponse:
    """
    Compare an operational document against regulatory standards.

    Returns structured gap report:
    ```json
    {
      "document": "...",
      "total_gaps": 5,
      "critical_count": 1,
      "warning_count": 3,
      "ok_count": 1,
      "gaps": [...]
    }
    ```
    """
    result = run_compliance_check(
        doc_name=body.doc_name,
        doc_type=body.doc_type,
        top_k=body.top_k,
    )
    status = 200 if "error" not in result else 404
    return JSONResponse(content=result, status_code=status)
