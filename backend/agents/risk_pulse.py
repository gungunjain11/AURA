"""
Risk Pulse — Background job that scans the knowledge base every 30 minutes.

Behaviour:
  - Runs as an asyncio background task started at FastAPI startup
  - Scans for: active permits expiring soon, anomaly signals, overdue maintenance
  - Uses Gemini to synthesise compound risk alerts
  - Maintains an in-memory deque of alerts (max 100)
  - Alerts are retrieved via GET /risk-pulse endpoint
"""
from __future__ import annotations

import asyncio
import json
import re
from collections import deque
from datetime import datetime, timezone
from typing import Any

import google.generativeai as genai

from config import settings
from ingestion import vector_store

genai.configure(api_key=settings.GEMINI_API_KEY)

_GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.1,
    max_output_tokens=1024,
)

# In-memory alert store (thread-safe enough for single-process FastAPI)
_alert_queue: deque[dict[str, Any]] = deque(maxlen=100)

# Sentinel to track if the background task is running
_task_handle: asyncio.Task | None = None

# ---------------------------------------------------------------------------
# Risk pulse prompts
# ---------------------------------------------------------------------------

_RISK_SCAN_QUERIES = [
    "active permits to work expiring maintenance due overdue",
    "equipment anomaly failure risk warning alert critical",
    "gas leak H2S toxic hazardous area permit expired",
    "overdue inspection maintenance schedule missed",
    "incident near miss hazard reported",
]

_SYNTHESIS_PROMPT = """You are AURA Risk Monitor, an industrial safety AI.
Review these knowledge base excerpts for active risk signals.
Identify compound risks — situations where multiple factors combine to elevate risk.

Extracted context:
{context}

---
Return a JSON array of risk alerts. Each alert:
{{
  "alert_id": "RISK-<timestamp>-<seq>",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "equipment": "<equipment or area name>",
  "title": "<short alert title, max 10 words>",
  "description": "<detailed risk description, 2-3 sentences>",
  "sources": ["<source 1>", "<source 2>"],
  "recommended_action": "<immediate action to take>"
}}

Return ONLY the JSON array. No markdown. No explanation.
If no real risks found, return an empty array: []
"""


async def _run_single_pulse() -> list[dict[str, Any]]:
    """Execute one risk pulse scan and return new alerts."""
    all_chunks: list[dict] = []
    seen_texts: set[str] = set()

    # Gather context from multiple risk-related queries
    for query in _RISK_SCAN_QUERIES:
        chunks = vector_store.query(query, top_k=3)
        for c in chunks:
            if c["text"] not in seen_texts:
                all_chunks.append(c)
                seen_texts.add(c["text"])

    if not all_chunks:
        return []

    # Build context text
    context = "\n\n".join(
        f"[{c['metadata'].get('source', '?')} | {c['metadata'].get('doc_type', '')}]\n{c['text'][:400]}"
        for c in all_chunks[:15]
    )

    prompt = _SYNTHESIS_PROMPT.format(context=context)
    model = genai.GenerativeModel(settings.GEMINI_MODEL)

    try:
        # Run in executor to not block event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt, generation_config=_GENERATION_CONFIG),
        )
        raw = response.text or "[]"
        raw = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
        alerts = json.loads(raw)
        if not isinstance(alerts, list):
            return []

        # Add timestamp
        now_iso = datetime.now(timezone.utc).isoformat()
        for alert in alerts:
            alert["timestamp"] = now_iso

        return alerts

    except Exception as exc:
        print(f"[risk_pulse] Scan error: {exc}")
        return []


async def _pulse_loop() -> None:
    """Background loop — runs every RISK_PULSE_INTERVAL_SECONDS."""
    print(f"[risk_pulse] Started — scanning every {settings.RISK_PULSE_INTERVAL_SECONDS}s")
    while True:
        try:
            new_alerts = await _run_single_pulse()
            for alert in new_alerts:
                _alert_queue.appendleft(alert)  # newest first
            if new_alerts:
                print(f"[risk_pulse] {len(new_alerts)} new alert(s) generated.")
        except Exception as exc:
            print(f"[risk_pulse] Loop error: {exc}")

        await asyncio.sleep(settings.RISK_PULSE_INTERVAL_SECONDS)


def start_background_task() -> None:
    """Called from FastAPI lifespan to start the pulse loop."""
    global _task_handle
    if _task_handle is None or _task_handle.done():
        _task_handle = asyncio.create_task(_pulse_loop())


def stop_background_task() -> None:
    """Called from FastAPI lifespan on shutdown."""
    global _task_handle
    if _task_handle and not _task_handle.done():
        _task_handle.cancel()
        _task_handle = None


def get_alerts(limit: int = 20) -> list[dict[str, Any]]:
    """Return the most recent risk alerts."""
    return list(_alert_queue)[:limit]


def inject_demo_alerts() -> None:
    """Inject demo alerts for testing without waiting 30 minutes."""
    demo_alerts = [
        {
            "alert_id": "RISK-DEMO-001",
            "severity": "CRITICAL",
            "equipment": "Coke Battery 3 — H2S Monitor",
            "title": "Gas detector offline — H2S area unmonitored",
            "description": (
                "H2S gas detector at Coke Battery 3 has been offline since Tuesday. "
                "Combined with active PTW for hot-work in the same zone, "
                "this creates a life-threatening compound risk. "
                "Immediate evacuation and detector replacement required."
            ),
            "sources": ["incident_log_coke_battery3", "PTW_register_2025"],
            "recommended_action": "Suspend all hot-work permits in CB3 zone. Deploy portable H2S detector immediately.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        {
            "alert_id": "RISK-DEMO-002",
            "severity": "HIGH",
            "equipment": "Pump-7 — Isolation System",
            "title": "PTW expiry imminent — Pump-7 maintenance ongoing",
            "description": (
                "Work permit for Pump-7 isolation expires in 4 hours. "
                "Maintenance activity is still in progress per latest log. "
                "Risk of permit lapse while workers are in the danger zone."
            ),
            "sources": ["PTW_register_2025", "maintenance_records_2025"],
            "recommended_action": "Renew PTW immediately or halt maintenance and restore Pump-7 to safe state.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        {
            "alert_id": "RISK-DEMO-003",
            "severity": "MEDIUM",
            "equipment": "Blast Furnace 2 — Pressure Relief Valve",
            "title": "PRV inspection overdue by 45 days",
            "description": (
                "Scheduled 6-monthly inspection for BF2 pressure relief valve is overdue. "
                "Factory Act Section 31 requires documented inspection. "
                "Potential regulatory penalty and mechanical failure risk."
            ),
            "sources": ["maintenance_records_2025", "OSD-110_regulatory_standard"],
            "recommended_action": "Schedule PRV inspection within 48 hours. Document in maintenance register.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    ]
    for alert in demo_alerts:
        _alert_queue.appendleft(alert)
