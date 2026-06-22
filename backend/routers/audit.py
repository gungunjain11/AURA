"""Audit router — audit pack generation and DOCX download."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from audit.audit_pack import generate_audit_pack

router = APIRouter(prefix="/audit-pack", tags=["Audit"])


class AuditRequest(BaseModel):
    topic: str = Field(
        ...,
        description="Topic or area to audit",
        examples=["PTW register OSD-110 compliance", "Pump-7 maintenance safety"],
    )
    top_k: int = Field(10, ge=1, le=20, description="Evidence chunks to retrieve")


@router.post("", summary="Generate a compliance audit pack")
async def generate_audit(body: AuditRequest) -> JSONResponse:
    """
    Generate an audit pack (JSON + DOCX) for a given topic.

    Returns the structured JSON report and a download link for the DOCX.
    """
    result = generate_audit_pack(topic=body.topic, top_k=body.top_k)

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    # Add download URL
    if result.get("docx_filename"):
        result["docx_download_url"] = f"/audit-pack/download/{result['docx_filename']}"

    return JSONResponse(content=result)


@router.get("/download/{filename}", summary="Download a generated audit DOCX")
async def download_audit_docx(filename: str) -> FileResponse:
    """Download a previously generated audit pack DOCX by filename."""
    from audit.audit_pack import _OUTPUT_DIR

    # Security: prevent path traversal
    safe_filename = Path(filename).name
    file_path = _OUTPUT_DIR / safe_filename

    if not file_path.exists() or not file_path.suffix == ".docx":
        raise HTTPException(status_code=404, detail="Audit pack not found.")

    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
