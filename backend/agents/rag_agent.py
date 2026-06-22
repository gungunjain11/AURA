"""
RAG Agent — Retrieval-Augmented Generation with Gemini 1.5 Flash.

Features:
  - Semantic search over ChromaDB
  - Role-aware prompting (engineer / safety_officer / field_tech)
  - Streaming SSE token output
  - Citation metadata injected into response
"""
from __future__ import annotations

import asyncio
import re
from typing import AsyncGenerator, Any

import google.generativeai as genai

from config import settings
from ingestion import vector_store

# ---------------------------------------------------------------------------
# Gemini client setup
# ---------------------------------------------------------------------------
genai.configure(api_key=settings.GEMINI_API_KEY)

_GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.2,
    max_output_tokens=1024,
)

ROLE_PERSONAS = {
    "engineer": (
        "You are AURA, an expert industrial AI assistant for process engineers. "
        "Provide technically precise answers citing the exact SOP section or document. "
        "Be concise but thorough. Flag any safety-critical steps clearly."
    ),
    "safety_officer": (
        "You are AURA, an industrial safety compliance AI. "
        "Prioritise regulatory compliance and hazard identification. "
        "Cite specific clauses from standards and SOPs. "
        "Flag severity levels (CRITICAL / WARNING / OK) explicitly."
    ),
    "field_tech": (
        "You are AURA, a field technician assistant. "
        "Give clear, step-by-step actionable instructions. "
        "Use simple language. Always mention PPE requirements and lockout/tagout steps first."
    ),
}

DEFAULT_PERSONA = ROLE_PERSONAS["engineer"]


def _build_prompt(query: str, context_chunks: list[dict[str, Any]], role: str) -> str:
    persona = ROLE_PERSONAS.get(role, DEFAULT_PERSONA)
    context_text = ""
    for i, chunk in enumerate(context_chunks):
        meta = chunk["metadata"]
        source = meta.get("source", meta.get("filename", "unknown"))
        doc_type = meta.get("doc_type", "")
        context_text += f"\n--- Context [{i+1}] | Source: {source} | Type: {doc_type} ---\n"
        context_text += chunk["text"] + "\n"

    prompt = f"""{persona}

You have access to the following retrieved documents from the plant knowledge base:

{context_text}

---
USER QUERY: {query}

Instructions:
1. Answer based ONLY on the retrieved context above.
2. After every factual claim, add an inline citation like [Source: <source_name>].
3. If the answer is not in the context, say "This information is not available in the current knowledge base."
4. Structure your response with clear headings if the answer is multi-part.
5. End with a "Confidence" line: High / Medium / Low based on context relevance.

ANSWER:
"""
    return prompt


async def stream_rag_response(
    query: str,
    role: str = "engineer",
    top_k: int = 5,
    doc_type_filter: str | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Async generator that yields SSE event dicts:
      {"type": "citation", "data": [...]}  — first event, citations list
      {"type": "token",    "data": str}    — streaming token
      {"type": "done",     "data": ""}     — final event
      {"type": "error",    "data": str}    — on failure
    """
    # 1. Retrieve relevant chunks
    where_filter = {"doc_type": doc_type_filter} if doc_type_filter else None
    chunks = vector_store.query(query, top_k=top_k, where=where_filter)

    if not chunks:
        yield {"type": "error", "data": "No relevant documents found. Please ingest documents first."}
        return

    # 2. Emit citations immediately so the UI can render them
    citations = [
        {
            "source": c["metadata"].get("source", c["metadata"].get("filename", "?")),
            "doc_type": c["metadata"].get("doc_type", ""),
            "page": c["metadata"].get("page_number", 1),
            "relevance_score": round(1 - c["distance"], 3),
        }
        for c in chunks
    ]
    yield {"type": "citation", "data": citations}

    # 3. Build prompt and call Gemini with streaming
    prompt = _build_prompt(query, chunks, role)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    def _collect_tokens() -> list[str]:
        """Collect all streaming tokens in a background thread."""
        tokens = []
        response = model.generate_content(
            prompt,
            generation_config=_GENERATION_CONFIG,
            stream=True,
        )
        for chunk in response:
            token = chunk.text if chunk.text else ""
            if token:
                tokens.append(token)
        return tokens

    try:
        # Run Gemini (synchronous) in thread pool so we don't block event loop
        tokens = await asyncio.get_event_loop().run_in_executor(None, _collect_tokens)
        for token in tokens:
            yield {"type": "token", "data": token}
            await asyncio.sleep(0)  # allow other coroutines to run
    except Exception as exc:
        yield {"type": "error", "data": f"Gemini error: {str(exc)}"}
        return

    yield {"type": "done", "data": ""}



def rag_query_sync(
    query: str,
    role: str = "engineer",
    top_k: int = 5,
) -> dict[str, Any]:
    """
    Synchronous RAG query — returns full answer + citations as dict.
    Used for audit pack generation and compliance checks internally.
    """
    chunks = vector_store.query(query, top_k=top_k)
    if not chunks:
        return {
            "answer": "No relevant documents found.",
            "citations": [],
            "confidence": "Low",
        }

    prompt = _build_prompt(query, chunks, role)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    response = model.generate_content(prompt, generation_config=_GENERATION_CONFIG)
    answer = response.text or ""

    citations = [
        {
            "source": c["metadata"].get("source", c["metadata"].get("filename", "?")),
            "doc_type": c["metadata"].get("doc_type", ""),
            "page": c["metadata"].get("page_number", 1),
        }
        for c in chunks
    ]

    # Extract confidence from answer if present
    confidence = "Medium"
    for line in reversed(answer.split("\n")):
        if "confidence" in line.lower():
            if "high" in line.lower():
                confidence = "High"
            elif "low" in line.lower():
                confidence = "Low"
            break

    return {"answer": answer, "citations": citations, "confidence": confidence}
