"""Ingest router — handles PDF and text file uploads."""
from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from ingestion.pdf_chunker import chunk_pdf, chunk_text_file
from ingestion.vector_store import add_chunks, list_docs

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

ALLOWED_EXTENSIONS = {".pdf", ".txt"}


@router.post("", summary="Upload and ingest a document")
async def ingest_document(
    file: Annotated[UploadFile, File(description="PDF or TXT file to ingest")],
    doc_type: Annotated[str | None, Form(description="Override doc type: SOP|PTW|INCIDENT_LOG|MAINTENANCE|REGULATORY|OEM_MANUAL|GENERAL")] = None,
) -> JSONResponse:
    """
    Upload a PDF or TXT file. It will be chunked, embedded, and stored in ChromaDB.
    Returns: doc_id, filename, chunks_count, doc_type
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        if suffix == ".pdf":
            chunks = chunk_pdf(tmp_path, doc_type=doc_type)
        else:
            chunks = chunk_text_file(tmp_path, doc_type=doc_type)

        # Override filename metadata to use original filename
        for c in chunks:
            c["metadata"]["filename"] = file.filename
            c["metadata"]["source"] = Path(file.filename).stem + (
                f", p.{c['metadata']['page_number']}" if suffix == ".pdf" else ""
            )

        count = add_chunks(chunks)
    finally:
        tmp_path.unlink(missing_ok=True)

    inferred_type = chunks[0]["metadata"]["doc_type"] if chunks else (doc_type or "GENERAL")

    return JSONResponse(
        content={
            "success": True,
            "filename": file.filename,
            "doc_type": inferred_type,
            "chunks_ingested": count,
            "message": f"Successfully ingested {count} chunks from '{file.filename}'.",
        }
    )


@router.get("/docs", summary="List all ingested documents")
async def list_ingested_docs() -> JSONResponse:
    """Return all unique documents currently in the knowledge base."""
    docs = list_docs()
    return JSONResponse(content={"documents": docs, "total": len(docs)})
