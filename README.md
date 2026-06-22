# AURA — Asset Understanding & Response AI
> A voice+chat AI copilot for industrial plants — ingest SOPs, PTWs, incident logs, and maintenance records, then query in plain language, detect compliance gaps, run root-cause analysis, and receive proactive risk alerts.

---

## Project Structure
The project is organized as a monorepo containing both the backend service and the web frontend client:
```text
AURA/
├── backend/          # FastAPI backend server
└── aura-frontend/    # React + Vite + D3 web client
```

---

## 1. Backend Service (`backend/`)

### Stack
*   **API:** FastAPI + uvicorn (SSE streaming, auto docs)
*   **LLM:** Gemini 1.5 Flash (1M token context window)
*   **Embeddings:** sentence-transformers (local `all-MiniLM-L6-v2`)
*   **Vector Store:** ChromaDB (local, persistent)
*   **PDF Parsing:** pypdf + pdfplumber
*   **DOCX Output:** python-docx
*   **Graph Engine:** networkx

### Setup & Local Run
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Configure your API key in a `.env` file (git-ignored for security):
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    GEMINI_MODEL=gemini-1.5-flash
    ```
4.  Seed the vector database with demo documentation (run once):
    ```bash
    python data/seed.py
    ```
5.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    *API documentation will be available at:* http://localhost:8000/docs

---

## 2. Frontend Client (`aura-frontend/`)

### Stack
*   **Core:** React + ReactDOM
*   **Bundler & Dev Server:** Vite
*   **Graph Engine:** D3.js (forces physics, zoom/pan)
*   **Aesthetics:** Harmonious navy and burnt-orange color themes, glassmorphism, pulse micro-animations

### Setup & Local Run
1.  Navigate to the frontend directory:
    ```bash
    cd aura-frontend
    ```
2.  Install Node dependencies:
    ```bash
    npm install
    ```
3.  Start the local Vite development server:
    ```bash
    npm run dev
    ```
    *The web client will be running at:* http://localhost:3000
