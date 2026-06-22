"""
AURA Seed Script — ingests all demo documents into ChromaDB.
Run this ONCE after installing dependencies to populate the knowledge base.

Usage:
    cd backend
    python data/seed.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add backend to path so imports work when running from data/ subdirectory
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from ingestion.pdf_chunker import chunk_text_file
from ingestion.vector_store import add_chunks, collection_count, list_docs

SEED_DIR = Path(__file__).parent / "seed_docs"

# Mapping filename → explicit doc type override
DOC_TYPE_MAP = {
    "SOP-117_Pump-7-isolation.txt": "SOP",
    "PTW_register_2025.txt": "PTW",
    "OSD-110_regulatory_standard.txt": "REGULATORY",
    "incident_log_coke_battery3.txt": "INCIDENT_LOG",
    "OEM_gas_detector_manual.txt": "OEM_MANUAL",
    "maintenance_records_2025.txt": "MAINTENANCE",
}


def seed_documents() -> None:
    print("=" * 60)
    print("AURA Seed Script — Knowledge Base Population")
    print("=" * 60)

    seed_files = sorted(SEED_DIR.glob("*.txt"))
    if not seed_files:
        print(f"[seed] No .txt files found in {SEED_DIR}")
        print("[seed] Please check the seed_docs directory.")
        return

    total_chunks = 0
    for file_path in seed_files:
        doc_type = DOC_TYPE_MAP.get(file_path.name)
        print(f"\n[seed] Processing: {file_path.name} (type: {doc_type or 'auto-detect'})")

        try:
            chunks = chunk_text_file(file_path, doc_type=doc_type)
            if not chunks:
                print(f"[seed]   [!] No chunks extracted from {file_path.name}")
                continue

            count = add_chunks(chunks)
            total_chunks += count
            print(f"[seed]   [OK] {count} chunks ingested")

        except Exception as exc:
            print(f"[seed]   [ERROR] {exc}")

    print("\n" + "=" * 60)
    print(f"[seed] Seeding complete!")
    print(f"[seed] Total chunks in DB: {collection_count('documents')}")
    print(f"[seed] Documents in KB:")
    for doc in list_docs():
        print(f"         - {doc['filename']} ({doc['doc_type']})")
    print("=" * 60)
    print("\n[seed] You can now start the server:")
    print("         cd backend && uvicorn main:app --reload --port 8000")
    print()


if __name__ == "__main__":
    seed_documents()
