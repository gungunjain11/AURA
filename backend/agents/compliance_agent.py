"""
Compliance Gap Agent — compares ingested SOPs/PTWs against regulatory standards.

Pipeline:
  1. Retrieve regulatory standard chunks (OSD-110, Factory Act, etc.)
  2. Retrieve SOP/PTW chunks for the target document
  3. Ask Gemini to identify gaps, classify severity
  4. Return structured JSON: {gaps: [{clause, severity, description, recommendation}]}
"""
from __future__ import annotations

import json
import re
from typing import Any

import google.generativeai as genai

from config import settings
from ingestion import vector_store

genai.configure(api_key=settings.GEMINI_API_KEY)

_GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.1,
    max_output_tokens=2048,
)

_SYSTEM_PROMPT = """You are AURA Compliance Analyser, an expert in Indian industrial safety law.
You compare operational documents (SOPs, PTWs) against regulatory standards.
You identify compliance gaps, classify their severity, and recommend corrective actions.

Severity levels:
  CRITICAL  — immediate regulatory violation, poses risk to life or serious penalty
  WARNING   — partial compliance, needs correction within 30 days
  OK        — fully compliant

Always respond with ONLY valid JSON. No markdown. No preamble."""


def _build_gap_prompt(doc_chunks: list[dict], reg_chunks: list[dict], doc_name: str) -> str:
    doc_text = "\n\n".join(
        f"[{c['metadata'].get('source', '')}]\n{c['text']}" for c in doc_chunks
    )
    reg_text = "\n\n".join(
        f"[{c['metadata'].get('source', '')}]\n{c['text']}" for c in reg_chunks
    )

    return f"""{_SYSTEM_PROMPT}

OPERATIONAL DOCUMENT: {doc_name}
{doc_text}

---
APPLICABLE REGULATIONS & STANDARDS:
{reg_text}

---
Task: Compare the operational document against the regulations above.
Identify ALL compliance gaps. For each gap, produce a JSON object.

Return this exact structure:
{{
  "document": "{doc_name}",
  "total_gaps": <number>,
  "critical_count": <number>,
  "warning_count": <number>,
  "ok_count": <number>,
  "gaps": [
    {{
      "id": "GAP-001",
      "clause": "<regulation clause reference>",
      "severity": "CRITICAL|WARNING|OK",
      "area": "<area of the operational document>",
      "description": "<what is missing or non-compliant>",
      "recommendation": "<specific corrective action>",
      "deadline_days": <30|90|null>
    }}
  ]
}}
"""


def run_compliance_check(
    doc_name: str,
    doc_type: str | None = None,
    top_k: int = 8,
) -> dict[str, Any]:
    """
    Run compliance gap analysis for a specific document or doc_type.

    Args:
        doc_name:  filename or identifier for the document to check
        doc_type:  filter by doc type (e.g. "PTW", "SOP")
        top_k:     number of chunks to retrieve per side

    Returns:
        Structured gap report dict.
    """
    # 1. Retrieve target document chunks
    doc_filter = {"filename": doc_name} if doc_name else None
    doc_chunks = vector_store.query(
        f"compliance requirements safety procedures {doc_name}",
        top_k=top_k,
        where=doc_filter,
    )

    # Fallback: try doc_type filter
    if not doc_chunks and doc_type:
        doc_chunks = vector_store.query(
            "safety procedures and work permits",
            top_k=top_k,
            where={"doc_type": doc_type},
        )

    if not doc_chunks:
        return {
            "error": f"Document '{doc_name}' not found in knowledge base. Please ingest it first.",
            "document": doc_name,
            "gaps": [],
        }

    # 2. Retrieve regulatory chunks
    reg_chunks = vector_store.query(
        "regulatory requirements compliance clauses factory act safety standards OSD",
        top_k=top_k,
        where={"doc_type": "REGULATORY"},
    )

    if not reg_chunks:
        # Fall back to any regulatory-like content
        reg_chunks = vector_store.query(
            "regulatory requirements compliance factory act safety standards",
            top_k=top_k,
        )

    # 3. Call Gemini
    prompt = _build_gap_prompt(doc_chunks, reg_chunks, doc_name)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    try:
        response = model.generate_content(prompt, generation_config=_GENERATION_CONFIG)
        raw = response.text or "{}"

        # Strip markdown code fences if present
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()

        result = json.loads(raw)
        return result

    except json.JSONDecodeError as exc:
        return {
            "error": f"Failed to parse Gemini response as JSON: {exc}",
            "raw_response": response.text if response else "",
            "document": doc_name,
            "gaps": [],
        }
    except Exception as exc:
        return {
            "error": f"Gemini error: {str(exc)}",
            "document": doc_name,
            "gaps": [],
        }
