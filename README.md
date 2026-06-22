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

---

## 3. Vercel Deployment (Frontend)

The frontend is a static React application built using Vite. To deploy it to **Vercel**:

### Step-by-Step Deployment
1.  Push this repository to your GitHub account (see instructions below).
2.  Log in to your [Vercel Dashboard](https://vercel.com/) and click **Add New** > **Project**.
3.  Import your GitHub repository.
4.  Under the **Configure Project** settings, configure the following:
    *   **Root Directory:** Select `aura-frontend`.
    *   **Framework Preset:** Select **Vite** (Vercel will usually auto-detect this).
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
5.  Add the **Environment Variables** (see below).
6.  Click **Deploy**.

### Environment Variables on Vercel
Add the following key in Vercel's Environment Variables setting panel:

*   **`VITE_API_BASE_URL`**: The HTTPS URL of your deployed backend service (e.g. `https://your-backend-api.railway.app`).

> [!WARNING]
> **Mixed Content Blocking Warning:** If you deploy your frontend to Vercel (which runs on secure HTTPS) but attempt to connect to a local backend running on `http://localhost:8000` (unsecure HTTP), your web browser will block the requests due to Mixed Content policies.
> To resolve this, either:
> 1. Run Vite locally (`npm run dev`) when testing against a local backend, OR
> 2. Host your FastAPI backend service on a public host (like Railway, Render, or fly.io) which provides a secure `https://...` endpoint, and set Vercel's `VITE_API_BASE_URL` to that public URL.

---

## 4. GitHub Upload Instructions

If you want to push this project to a new repository on GitHub:

1.  Create an empty repository on GitHub.com (do **not** check "Add a README" or "Add .gitignore").
2.  Open your terminal in the root directory (`C:\Users\AASHI JAIN\OneDrive\Documents\AURA`) and run:
    ```bash
    # Rename branch to main
    git branch -M main

    # Link the remote repository
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

    # Push to GitHub
    git push -u origin main
    ```
    *Note: Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub details.*
