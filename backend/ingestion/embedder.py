"""
Embedder — wraps sentence-transformers for local, free text embeddings.
Model: all-MiniLM-L6-v2 (22MB, downloads once, runs on CPU).
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the embedding model (singleton)."""
    global _model
    if _model is None:
        print(f"[embedder] Loading model '{MODEL_NAME}' (first run downloads ~22 MB)…")
        _model = SentenceTransformer(MODEL_NAME)
        print("[embedder] Model ready.")
    return _model


def embed(texts: list[str], batch_size: int = 64) -> list[list[float]]:
    """
    Embed a list of strings.
    Returns a list of float vectors (384-dim for all-MiniLM-L6-v2).
    """
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, batch_size=batch_size, show_progress_bar=False)
    return [v.tolist() for v in vectors]


def embed_single(text: str) -> list[float]:
    """Convenience wrapper for a single string."""
    return embed([text])[0]
