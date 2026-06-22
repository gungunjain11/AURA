"""
Vector Store — Pure NumPy/JSON implementation for AURA.
No C++ compilation needed. Works on Windows without any build tools.

Storage: JSON lines file + numpy arrays (loaded into memory on first use).
Persistence: survives server restarts via JSON file.

Uses cosine similarity for semantic search.
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any

import numpy as np

from config import settings
from ingestion.embedder import embed, embed_single

# ---------------------------------------------------------------------------
# Storage paths
# ---------------------------------------------------------------------------
_DB_DIR = Path(settings.CHROMA_PERSIST_DIR)  # reuse the same config key

_COLLECTIONS: dict[str, "_Collection"] = {}


class _Collection:
    """
    In-memory vector collection with JSON + numpy file persistence.

    Structure on disk:
        <db_dir>/<name>_meta.jsonl   — metadata and text, one JSON obj per line
        <db_dir>/<name>_vecs.npy     — float32 matrix, shape (N, D)
    """

    def __init__(self, name: str, db_dir: Path) -> None:
        self.name = name
        self.db_dir = db_dir
        self.db_dir.mkdir(parents=True, exist_ok=True)

        self._meta_path = db_dir / f"{name}_meta.jsonl"
        self._vecs_path = db_dir / f"{name}_vecs.npy"

        # In-memory store
        self._texts: list[str] = []
        self._metadatas: list[dict] = []
        self._ids: list[str] = []
        self._vectors: np.ndarray | None = None   # shape (N, D)

        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        """Load from disk on startup."""
        if not self._meta_path.exists():
            return

        with self._meta_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                self._ids.append(obj["id"])
                self._texts.append(obj["text"])
                self._metadatas.append(obj["metadata"])

        if self._vecs_path.exists() and self._ids:
            try:
                self._vectors = np.load(str(self._vecs_path))
                if self._vectors.shape[0] != len(self._ids):
                    print(f"[vector_store] Warning: {self.name} vector/meta mismatch — resetting.")
                    self._reset()
            except Exception as exc:
                print(f"[vector_store] Failed to load vectors: {exc} — resetting.")
                self._reset()

    def _reset(self) -> None:
        self._texts = []
        self._metadatas = []
        self._ids = []
        self._vectors = None

    def _save(self) -> None:
        """Persist current state to disk."""
        # Save metadata
        with self._meta_path.open("w", encoding="utf-8") as f:
            for doc_id, text, meta in zip(self._ids, self._texts, self._metadatas):
                f.write(json.dumps({"id": doc_id, "text": text, "metadata": meta}) + "\n")

        # Save vectors
        if self._vectors is not None:
            np.save(str(self._vecs_path), self._vectors.astype(np.float32))

    # ------------------------------------------------------------------
    # Public API (mirrors ChromaDB)
    # ------------------------------------------------------------------

    def add(
        self,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
        new_vecs = np.array(embeddings, dtype=np.float32)

        if self._vectors is None:
            self._vectors = new_vecs
        else:
            self._vectors = np.vstack([self._vectors, new_vecs])

        self._ids.extend(ids)
        self._texts.extend(documents)
        self._metadatas.extend(metadatas)

        self._save()

    def query(
        self,
        query_embeddings: list[list[float]],
        n_results: int = 5,
        where: dict | None = None,
    ) -> dict[str, list]:
        """Cosine similarity search."""
        if self._vectors is None or len(self._ids) == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        q = np.array(query_embeddings[0], dtype=np.float32)
        q_norm = q / (np.linalg.norm(q) + 1e-10)

        vecs = self._vectors
        norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-10
        normed = vecs / norms

        similarities = normed @ q_norm   # cosine similarity, shape (N,)
        distances = 1.0 - similarities   # cosine distance (lower = closer)

        # Apply where filter (simple key=value matching)
        if where:
            mask = np.ones(len(self._ids), dtype=bool)
            for key, value in where.items():
                for i, meta in enumerate(self._metadatas):
                    if meta.get(key) != value:
                        mask[i] = False
            valid_indices = np.where(mask)[0]
        else:
            valid_indices = np.arange(len(self._ids))

        if len(valid_indices) == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        filtered_dists = distances[valid_indices]
        top_n = min(n_results, len(valid_indices))
        top_order = np.argsort(filtered_dists)[:top_n]
        top_indices = valid_indices[top_order]
        top_dists = distances[top_indices]

        return {
            "documents": [[self._texts[i] for i in top_indices]],
            "metadatas": [[self._metadatas[i] for i in top_indices]],
            "distances": [[float(d) for d in top_dists]],
        }

    def get(self, include: list[str] | None = None) -> dict[str, list]:
        return {
            "ids": self._ids,
            "documents": self._texts,
            "metadatas": self._metadatas,
        }

    def count(self) -> int:
        return len(self._ids)

    def delete(self) -> None:
        self._reset()
        if self._meta_path.exists():
            self._meta_path.unlink()
        if self._vecs_path.exists():
            self._vecs_path.unlink()


# ---------------------------------------------------------------------------
# Collection registry
# ---------------------------------------------------------------------------

def _get_collection(name: str) -> _Collection:
    if name not in _COLLECTIONS:
        _COLLECTIONS[name] = _Collection(name, _DB_DIR)
    return _COLLECTIONS[name]


# ---------------------------------------------------------------------------
# Public API (same interface as the old ChromaDB version)
# ---------------------------------------------------------------------------

def add_chunks(chunks: list[dict[str, Any]], collection_name: str = "documents") -> int:
    """
    Add a list of chunk dicts (from pdf_chunker) to the vector store.
    Returns the number of chunks added.
    """
    if not chunks:
        return 0

    col = _get_collection(collection_name)
    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    ids = [str(uuid.uuid4()) for _ in chunks]
    embeddings = embed(texts)

    col.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)
    return len(chunks)


def query(
    text: str,
    top_k: int = 5,
    collection_name: str = "documents",
    where: dict | None = None,
) -> list[dict[str, Any]]:
    """
    Semantic search.
    Returns list of:
        {"text": str, "metadata": dict, "distance": float}
    sorted by relevance (lowest distance = most relevant).
    """
    col = _get_collection(collection_name)
    query_embedding = embed_single(text)

    try:
        results = col.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
        )
    except Exception as exc:
        print(f"[vector_store] query error: {exc}")
        return []

    output: list[dict[str, Any]] = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs, metas, dists):
        output.append({"text": doc, "metadata": meta, "distance": dist})

    return output


def list_docs(collection_name: str = "documents") -> list[dict[str, Any]]:
    """Return unique documents (by filename) in the collection."""
    col = _get_collection(collection_name)
    try:
        results = col.get(include=["metadatas"])
    except Exception:
        return []

    seen: set[str] = set()
    docs: list[dict[str, Any]] = []
    for meta in results.get("metadatas", []):
        fname = meta.get("filename", "unknown")
        if fname not in seen:
            seen.add(fname)
            docs.append({
                "filename": fname,
                "doc_type": meta.get("doc_type", "GENERAL"),
            })
    return docs


def delete_collection(collection_name: str = "documents") -> None:
    """Drop a collection (used in testing/reset)."""
    col = _get_collection(collection_name)
    col.delete()
    if collection_name in _COLLECTIONS:
        del _COLLECTIONS[collection_name]


def collection_count(collection_name: str = "documents") -> int:
    """Return total chunk count in a collection."""
    try:
        return _get_collection(collection_name).count()
    except Exception:
        return 0
