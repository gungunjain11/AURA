# AURA — Asset Understanding & Response AI
### Backend (Person 1 — Backend Engineer)

> A voice+chat AI copilot for industrial plants — ingest SOPs, PTWs, incident logs, and maintenance records, then query in plain language, detect compliance gaps, run root-cause analysis, and receive proactive risk alerts.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| API | FastAPI + uvicorn | Async, SSE support, auto-docs |
| LLM | Gemini 1.5 Flash (free tier) | 1M tokens/day, 15 RPM — no cost |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) | Local, free, 384-dim |
| Vector Store | ChromaDB (persistent) | Local, no cloud required |
| PDF Parsing | pypdf + pdfplumber | Text + tables |
| DOCX Output | python-docx | Audit pack generation |
| Graph | networkx + D3 JSON | Knowledge graph |

---

## Quick Start

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure API key
The `.env` file is already created with your Gemini key.
To update it:
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
```
Get a free key at: https://aistudio.google.com

### 3. Seed the knowledge base
```bash
python data/seed.py
```
This ingests 6 realistic demo documents (SOP, PTW, OSD-110, incident log, OEM manual, maintenance records).

### 4. Start the server
```bash
uvicorn main:app --reload --port 8000
```

### 5. View API docs
Open: http://localhost:8000/docs

---

## API Endpoints

| Method | URL | Description |
|---|---|---|
| `POST` | `/ingest` | Upload PDF or TXT |
| `GET` | `/ingest/docs` | List ingested documents |
| `GET` | `/query?q=...&role=engineer` | **SSE streaming RAG query** |
| `GET` | `/query/sync?q=...` | Non-streaming RAG query |
| `POST` | `/compliance-check` | Compliance gap analysis |
| `POST` | `/rca` | Root Cause Analysis |
| `GET` | `/risk-pulse` | Current risk alerts |
| `POST` | `/risk-pulse/demo` | Inject demo alerts |
| `POST` | `/audit-pack` | Generate audit pack (JSON + DOCX) |
| `GET` | `/audit-pack/download/{filename}` | Download DOCX |
| `GET` | `/graph` | D3 knowledge graph JSON |
| `GET` | `/health` | Health check |

---

## Demo Queries (from Spec)

### Query 1 — Maintenance Q&A
```bash
curl "http://localhost:8000/query/sync?q=What+is+the+safe+isolation+procedure+for+Pump-7+before+maintenance&role=engineer"
```

### Query 2 — Compliance Check
```bash
curl -X POST http://localhost:8000/compliance-check \
  -H "Content-Type: application/json" \
  -d '{"doc_name": "PTW_register_2025.txt"}'
```

### Query 3 — RCA
```bash
curl -X POST http://localhost:8000/rca \
  -H "Content-Type: application/json" \
  -d '{"incident": "We had a gas detector miss last Tuesday near coke battery 3 — why?"}'
```

### Query 4 — Hot Work Risk Query
```bash
curl "http://localhost:8000/query/sync?q=What+do+we+know+about+hot+work+near+elevated+H2S+zones&role=safety_officer"
```

### Audit Pack
```bash
curl -X POST http://localhost:8000/audit-pack \
  -H "Content-Type: application/json" \
  -d '{"topic": "PTW register OSD-110 compliance"}'
```

### Risk Pulse (with demo data)
```bash
# Inject demo alerts first
curl -X POST http://localhost:8000/risk-pulse/demo

# Get alerts
curl http://localhost:8000/risk-pulse
```

### Knowledge Graph
```bash
curl http://localhost:8000/graph
```

---

## SSE Streaming (Query Endpoint)

The `/query` endpoint streams using Server-Sent Events.

**Event types:**
- `citation` — JSON array of retrieved source documents (emitted first)
- `token` — individual text tokens (streamed)
- `done` — signals completion
- `error` — error message

**JavaScript example:**
```javascript
const evtSource = new EventSource(
  `http://localhost:8000/query?q=${encodeURIComponent(query)}&role=engineer`
);

evtSource.addEventListener('citation', (e) => {
  const citations = JSON.parse(e.data);
  renderCitations(citations);
});

evtSource.addEventListener('token', (e) => {
  appendToChat(e.data);
});

evtSource.addEventListener('done', () => evtSource.close());
evtSource.addEventListener('error', (e) => console.error(e.data));
```

---

## Project Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── config.py                  # Settings from .env
├── requirements.txt
├── .env                       # API keys (do not commit!)
├── .env.example               # Template for new devs
│
├── ingestion/
│   ├── pdf_chunker.py         # PDF/TXT → overlapping chunks with metadata
│   ├── embedder.py            # sentence-transformers (local, free)
│   └── vector_store.py        # ChromaDB wrapper (persistent)
│
├── agents/
│   ├── rag_agent.py           # RAG + Gemini streaming SSE
│   ├── compliance_agent.py    # Compliance gap analysis (Gemini)
│   ├── rca_agent.py           # Root cause analysis (5-Why + Fault Tree)
│   └── risk_pulse.py          # Background 30-min scan + alert queue
│
├── audit/
│   └── audit_pack.py          # Audit report generator (JSON + DOCX)
│
├── graph/
│   └── knowledge_graph.py     # D3 graph builder (equipment/doc/risk nodes)
│
├── routers/
│   ├── ingest.py
│   ├── query.py
│   ├── compliance.py
│   ├── rca.py
│   ├── risk_pulse.py
│   ├── audit.py
│   └── graph.py
│
├── data/
│   ├── seed.py                # Run once to populate ChromaDB
│   ├── seed_docs/             # 6 realistic demo documents
│   └── audit_packs/           # Generated DOCX files (auto-created)
│
└── chroma_db/                 # Persistent vector store (auto-created)
```

---

## Roles Supported

| Role | Persona |
|---|---|
| `engineer` | Technical precision, cites SOP sections |
| `safety_officer` | Regulatory focus, severity levels |
| `field_tech` | Step-by-step, PPE first |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AURA Backend (FastAPI)                   │
│                                                             │
│  PDF/TXT Upload                                             │
│       │                                                     │
│  ┌────▼──────────┐    ┌───────────────────────────────────┐ │
│  │ PDF Chunker   │    │         ChromaDB                  │ │
│  │ (pypdf +      │───▶│    (persistent vector store)     │  │
│  │  pdfplumber)  │    │    collection: "documents"        │ │
│  └────────────┬──┘    └───────────────┬───────────────────┘ │
│               │                       │                     │
│  ┌────────────▼──┐                    │                     │
│  │  Embedder     │                    │ semantic search     │
│  │  (MiniLM-L6)  │                    │                     │
│  └───────────────┘                    │                     │
│                                       │                     │
│  ┌────────────────────────────────────▼─────────────────┐   │
│  │                    Gemini 1.5 Flash                  │   │
│  │  ┌──────────┐  ┌─────────────┐  ┌────────────────┐   │   │
│  │  │ RAG Agent│  │  Compliance │  │   RCA Agent    │   │   │
│  │  │(SSE str.)│  │    Agent    │  │ (5-Why + FTA)  │   │   │
│  │  └──────────┘  └─────────────┘  └────────────────┘   │   │
│  │  ┌──────────┐  ┌─────────────┐                       │   │
│  │  │ Audit    │  │ Risk Pulse  │ (background, 30 min)  │   │
│  │  │  Pack    │  │   Scanner   │                       │   │
│  │  └──────────┘  └─────────────┘                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Knowledge Graph Builder                 │  │
│  │  equipment (purple) → documents (teal) → risks (amber)│  │
│  │    → D3-compatible JSON for frontend                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Gemini API Free Tier Limits

| Metric | Limit |
|---|---|
| Requests per minute | 15 RPM |
| Tokens per day | 1,000,000 |
| Context window | 1M tokens |

For a demo/PS8 presentation with 4 sample queries, this is more than sufficient.

---

## Notes for Person 2 (Frontend)

- **CORS**: Open (`*`) — no configuration needed
- **Base URL**: `http://localhost:8000`
- **SSE streaming**: `/query?q=...&role=...` — use EventSource API
- **Knowledge graph**: `/graph` returns D3 JSON with `nodes[]` and `links[]`
- **Risk alerts**: `/risk-pulse` — poll every 30 seconds or so
- **Demo data**: Call `POST /risk-pulse/demo` once to pre-populate alerts
