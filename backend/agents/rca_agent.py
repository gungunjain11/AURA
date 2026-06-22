"""
RCA Agent — Root Cause Analysis using multi-hop reasoning with Gemini.

Pipeline:
  1. Retrieve incident logs + OEM manuals + maintenance records related to incident
  2. Gemini performs multi-hop reasoning to produce root cause tree
  3. Returns structured JSON with root cause, contributing factors, evidence, recommendations
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
    temperature=0.15,
    max_output_tokens=2048,
)

_SYSTEM_PROMPT = """You are AURA RCA Engine, an expert industrial accident investigator.
You perform systematic Root Cause Analysis (RCA) using the "5-Why" and "Fault Tree" methodologies.
You cite specific evidence from incident logs, OEM manuals, and maintenance records.

Always respond with ONLY valid JSON. No markdown. No preamble."""


def _build_rca_prompt(incident: str, evidence_chunks: list[dict]) -> str:
    evidence_text = "\n\n".join(
        f"[Evidence {i+1} | {c['metadata'].get('source', '')} | {c['metadata'].get('doc_type', '')}]\n{c['text']}"
        for i, c in enumerate(evidence_chunks)
    )

    return f"""{_SYSTEM_PROMPT}

INCIDENT DESCRIPTION:
{incident}

---
RETRIEVED EVIDENCE FROM KNOWLEDGE BASE:
{evidence_text}

---
Task: Perform a complete Root Cause Analysis of this incident.

Return this exact JSON structure:
{{
  "incident_summary": "<one-sentence summary>",
  "root_cause": {{
    "description": "<primary root cause>",
    "category": "MECHANICAL|HUMAN_ERROR|PROCESS|ENVIRONMENTAL|MANAGEMENT_SYSTEM",
    "evidence": ["<evidence reference 1>", "<evidence reference 2>"]
  }},
  "contributing_factors": [
    {{
      "factor": "<description>",
      "category": "<category>",
      "evidence": "<source reference>"
    }}
  ],
  "five_whys": [
    {{"why": 1, "question": "Why did X happen?", "answer": "Because Y"}},
    {{"why": 2, "question": "Why did Y happen?", "answer": "Because Z"}},
    {{"why": 3, "question": "...", "answer": "..."}},
    {{"why": 4, "question": "...", "answer": "..."}},
    {{"why": 5, "question": "...", "answer": "<root cause>"}}
  ],
  "fault_tree": [
    {{"node": "Top Event", "description": "<incident>", "children": ["Event A", "Event B"]}},
    {{"node": "Event A", "description": "...", "children": ["Basic Cause 1"]}},
    {{"node": "Event B", "description": "...", "children": ["Basic Cause 2", "Basic Cause 3"]}}
  ],
  "recommendations": [
    {{
      "id": "REC-001",
      "action": "<corrective action>",
      "priority": "IMMEDIATE|SHORT_TERM|LONG_TERM",
      "owner": "<department or role>",
      "deadline_days": <number>
    }}
  ],
  "confidence": "HIGH|MEDIUM|LOW",
  "evidence_used": [<list of source names>]
}}
"""


def run_rca(incident: str, top_k: int = 8) -> dict[str, Any]:
    """
    Perform Root Cause Analysis for a described incident.

    Args:
        incident: Free-text incident description
        top_k:    Number of evidence chunks to retrieve

    Returns:
        Structured RCA report dict.
    """
    if not incident.strip():
        return {"error": "Incident description cannot be empty."}

    # Retrieve multi-type evidence
    chunks = vector_store.query(incident, top_k=top_k)

    # Also search specifically in incident logs + OEM manuals + maintenance
    supplemental: list[dict] = []
    for doc_type in ["INCIDENT_LOG", "OEM_MANUAL", "MAINTENANCE"]:
        extra = vector_store.query(incident, top_k=3, where={"doc_type": doc_type})
        supplemental.extend(extra)

    # Merge and deduplicate by text
    all_chunks = chunks.copy()
    seen_texts = {c["text"] for c in chunks}
    for c in supplemental:
        if c["text"] not in seen_texts:
            all_chunks.append(c)
            seen_texts.add(c["text"])

    all_chunks = all_chunks[:top_k + 4]  # keep reasonable context size

    if not all_chunks:
        return {
            "error": "No relevant evidence found. Please ingest incident logs, OEM manuals, and maintenance records.",
            "incident_summary": incident,
            "root_cause": None,
            "recommendations": [],
        }

    prompt = _build_rca_prompt(incident, all_chunks)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    try:
        response = model.generate_content(prompt, generation_config=_GENERATION_CONFIG)
        raw = response.text or "{}"
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
        return json.loads(raw)

    except json.JSONDecodeError as exc:
        return {
            "error": f"Failed to parse RCA response: {exc}",
            "raw_response": response.text if response else "",
            "incident_summary": incident,
        }
    except Exception as exc:
        return {
            "error": f"Gemini error: {str(exc)}",
            "incident_summary": incident,
        }
