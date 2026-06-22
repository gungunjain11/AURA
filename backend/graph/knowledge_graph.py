"""
Knowledge Graph Builder — produces D3-compatible graph JSON.

Node types:
  - equipment  (purple) : physical assets (pumps, furnaces, detectors)
  - document   (teal)   : SOPs, PTWs, manuals, incident logs
  - risk       (amber)  : identified risk signals

Edge types:
  - equipment → document  : "references" (equipment is mentioned in doc)
  - document  → risk      : "mentions"   (doc describes a risk)
  - equipment → risk      : "has_risk"   (equipment has an associated risk)
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Any

import networkx as nx

from ingestion import vector_store


# ---------------------------------------------------------------------------
# Entity extraction patterns
# ---------------------------------------------------------------------------

EQUIPMENT_PATTERNS = [
    r"\bPump[-\s]?\d+\b",
    r"\bBlast\s+Furnace\s*\d*\b",
    r"\bCoke\s+Battery\s*\d*\b",
    r"\bBF[-\s]?\d+\b",
    r"\bBOF[-\s]?\d+\b",
    r"\bHeat\s+Exchanger\s*\d*\b",
    r"\bCompressor\s*\d*\b",
    r"\bValve\s*[-\s]?\d*\b",
    r"\bGas\s+Detector\s*\d*\b",
    r"\bPRV[-\s]?\d*\b",
    r"\bCranes?\b",
    r"\bConveyor\s*\d*\b",
    r"\bElectric\s+Arc\s+Furnace\b",
    r"\bLadle\s+Furnace\b",
    r"\bContinuous\s+Caster\b",
]

RISK_PATTERNS = [
    r"\bH2S\s+exposure\b",
    r"\bgas\s+leak\b",
    r"\bfire\s+hazard\b",
    r"\bexplosion\s+risk\b",
    r"\belectrical\s+hazard\b",
    r"\bpressure\s+buildup\b",
    r"\bpermit\s+expir[yi]\b",
    r"\boverdue\s+inspection\b",
    r"\bfailure\s+risk\b",
    r"\bchemical\s+spill\b",
    r"\bfall\s+hazard\b",
    r"\bhot\s+work\s+risk\b",
    r"\btoxic\s+exposure\b",
    r"\bmechanical\s+failure\b",
]


def _extract_entities(text: str) -> dict[str, list[str]]:
    """Extract equipment and risk entities from a chunk of text."""
    text_lower = text.lower()
    entities: dict[str, list[str]] = {"equipment": [], "risk": []}

    for pattern in EQUIPMENT_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["equipment"].extend([m.strip() for m in matches])

    for pattern in RISK_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["risk"].extend([m.strip().lower() for m in matches])

    return entities


def _normalise(name: str) -> str:
    """Normalise entity name for deduplication."""
    return re.sub(r"\s+", " ", name.strip().lower())


def build_knowledge_graph() -> dict[str, Any]:
    """
    Build the D3-compatible knowledge graph from all ingested documents.

    Returns:
        {
            "nodes": [{"id": str, "type": "equipment|document|risk", "label": str, "group": int}],
            "links": [{"source": str, "target": str, "relation": str}]
        }
    """
    G = nx.DiGraph()
    node_types: dict[str, str] = {}  # id → type
    node_labels: dict[str, str] = {}

    # Retrieve all chunks
    chunks = vector_store.query(
        "equipment maintenance procedure safety risk permit",
        top_k=50,
    )

    # Also directly get metadata of all docs
    all_docs = vector_store.list_docs()

    # Add document nodes
    for doc in all_docs:
        fname = doc["filename"]
        doc_id = f"doc::{fname}"
        if doc_id not in G:
            G.add_node(doc_id)
            node_types[doc_id] = "document"
            node_labels[doc_id] = fname.replace("_", " ").replace(".txt", "").replace(".pdf", "")

    # Process chunks for entity extraction
    equipment_doc_edges: set[tuple[str, str]] = set()
    equipment_risk_edges: set[tuple[str, str]] = set()
    doc_risk_edges: set[tuple[str, str]] = set()

    for chunk in chunks:
        fname = chunk["metadata"].get("filename", "unknown")
        doc_id = f"doc::{fname}"
        entities = _extract_entities(chunk["text"])

        for eq in entities["equipment"]:
            eq_norm = _normalise(eq)
            eq_id = f"equip::{eq_norm}"
            if eq_id not in G:
                G.add_node(eq_id)
                node_types[eq_id] = "equipment"
                node_labels[eq_id] = eq.strip()
            equipment_doc_edges.add((eq_id, doc_id))

        for risk in entities["risk"]:
            risk_norm = _normalise(risk)
            risk_id = f"risk::{risk_norm}"
            if risk_id not in G:
                G.add_node(risk_id)
                node_types[risk_id] = "risk"
                node_labels[risk_id] = risk.strip().title()
            doc_risk_edges.add((doc_id, risk_id))

            for eq in entities["equipment"]:
                eq_id = f"equip::{_normalise(eq)}"
                if eq_id in G:
                    equipment_risk_edges.add((eq_id, risk_id))

    # Add all edges
    for src, tgt in equipment_doc_edges:
        G.add_edge(src, tgt, relation="references")
    for src, tgt in doc_risk_edges:
        G.add_edge(src, tgt, relation="mentions")
    for src, tgt in equipment_risk_edges:
        G.add_edge(src, tgt, relation="has_risk")

    # Build D3 output
    group_map = {"equipment": 1, "document": 2, "risk": 3}
    nodes = [
        {
            "id": node_id,
            "label": node_labels.get(node_id, node_id),
            "type": node_types.get(node_id, "document"),
            "group": group_map.get(node_types.get(node_id, "document"), 2),
        }
        for node_id in G.nodes()
    ]

    links = [
        {
            "source": u,
            "target": v,
            "relation": G[u][v].get("relation", "related"),
        }
        for u, v in G.edges()
    ]

    return {
        "nodes": nodes,
        "links": links,
        "stats": {
            "total_nodes": len(nodes),
            "equipment_nodes": sum(1 for n in nodes if n["type"] == "equipment"),
            "document_nodes": sum(1 for n in nodes if n["type"] == "document"),
            "risk_nodes": sum(1 for n in nodes if n["type"] == "risk"),
            "total_edges": len(links),
        },
    }
