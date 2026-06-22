"""
PDF Chunker — extracts text from PDFs and splits into overlapping chunks.
Supports: pypdf (text), pdfplumber (tables).
Each chunk carries full metadata for citation display.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pdfplumber
import pypdf


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
CHUNK_TOKENS = 512       # approximate token target per chunk
OVERLAP_TOKENS = 50      # overlap between consecutive chunks
WORDS_PER_TOKEN = 0.75   # rough word → token ratio


def _token_estimate(text: str) -> int:
    """Rough token count (words / 0.75)."""
    return int(len(text.split()) / WORDS_PER_TOKEN)


def _split_into_chunks(text: str, chunk_tokens: int = CHUNK_TOKENS,
                        overlap_tokens: int = OVERLAP_TOKENS) -> list[str]:
    """
    Splits a long string into overlapping chunks measured in approximate tokens.
    Tries to split on paragraph/sentence boundaries first.
    """
    # Normalise whitespace
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []

    words = text.split()
    chunk_size = int(chunk_tokens * WORDS_PER_TOKEN)   # words
    overlap_size = int(overlap_tokens * WORDS_PER_TOKEN)

    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_text = " ".join(words[start:end])
        chunks.append(chunk_text)
        if end == len(words):
            break
        start = end - overlap_size  # slide back for overlap

    return chunks


def _extract_text_pypdf(path: Path) -> list[dict[str, Any]]:
    """Extract (page_number, text) pairs using pypdf."""
    pages = []
    try:
        reader = pypdf.PdfReader(str(path))
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": i + 1, "text": text})
    except Exception as exc:
        print(f"[pdf_chunker] pypdf error on {path.name}: {exc}")
    return pages


def _extract_tables_pdfplumber(path: Path) -> list[dict[str, Any]]:
    """
    Extract tables from PDF pages using pdfplumber.
    Tables are serialised as markdown-like text so they can be embedded.
    """
    table_texts = []
    try:
        with pdfplumber.open(str(path)) as pdf:
            for i, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    if not table:
                        continue
                    rows = []
                    for row in table:
                        cleaned = [str(c).strip() if c else "" for c in row]
                        rows.append(" | ".join(cleaned))
                    table_text = "\n".join(rows)
                    if table_text.strip():
                        table_texts.append({"page": i + 1, "text": f"[TABLE]\n{table_text}"})
    except Exception as exc:
        print(f"[pdf_chunker] pdfplumber error on {path.name}: {exc}")
    return table_texts


def _infer_doc_type(filename: str) -> str:
    """Infer document type from filename heuristics."""
    name = filename.lower()
    if "sop" in name:
        return "SOP"
    if "ptw" in name or "permit" in name:
        return "PTW"
    if "incident" in name or "accident" in name:
        return "INCIDENT_LOG"
    if "maintenance" in name or "maint" in name:
        return "MAINTENANCE"
    if "osd" in name or "factory_act" in name or "regulation" in name or "standard" in name:
        return "REGULATORY"
    if "oem" in name or "manual" in name:
        return "OEM_MANUAL"
    return "GENERAL"


def chunk_pdf(file_path: str | Path, doc_type: str | None = None) -> list[dict[str, Any]]:
    """
    Main entry point.
    Returns a list of chunk dicts:
        {
            "text": str,
            "metadata": {
                "filename": str,
                "page_number": int,
                "doc_type": str,
                "chunk_index": int,
                "source": str,   # display label
            }
        }
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    inferred_type = doc_type or _infer_doc_type(path.name)

    # Combine text pages + table extractions
    page_texts = _extract_text_pypdf(path)
    table_texts = _extract_tables_pdfplumber(path)

    # Merge table text into matching pages
    table_map: dict[int, str] = {}
    for t in table_texts:
        table_map.setdefault(t["page"], "")
        table_map[t["page"]] += "\n" + t["text"]

    chunks: list[dict[str, Any]] = []
    chunk_index = 0

    for page_info in page_texts:
        page_num = page_info["page"]
        full_text = page_info["text"]
        if page_num in table_map:
            full_text += "\n" + table_map[page_num]

        for chunk_text in _split_into_chunks(full_text):
            if not chunk_text.strip():
                continue
            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "filename": path.name,
                    "page_number": page_num,
                    "doc_type": inferred_type,
                    "chunk_index": chunk_index,
                    "source": f"{path.stem}, p.{page_num}",
                },
            })
            chunk_index += 1

    return chunks


def chunk_text_file(file_path: str | Path, doc_type: str | None = None) -> list[dict[str, Any]]:
    """
    Ingest plain .txt files (used for seed demo data).
    Same output schema as chunk_pdf.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    inferred_type = doc_type or _infer_doc_type(path.name)
    text = path.read_text(encoding="utf-8")

    chunks: list[dict[str, Any]] = []
    for i, chunk_text in enumerate(_split_into_chunks(text)):
        if not chunk_text.strip():
            continue
        chunks.append({
            "text": chunk_text,
            "metadata": {
                "filename": path.name,
                "page_number": 1,
                "doc_type": inferred_type,
                "chunk_index": i,
                "source": path.stem,
            },
        })
    return chunks
