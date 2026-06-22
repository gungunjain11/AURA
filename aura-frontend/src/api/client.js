// src/api/client.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ─── 1. queryAPI ────────────────────────────────────────────────────────────
// GET /query — returns a streaming Response object.
// Use EventSource on the backend side, but fetch here returns the raw stream reader.
export const queryAPI = async (prompt, role = 'engineer', signal) => {
  const url = `${BASE_URL}/query?q=${encodeURIComponent(prompt)}&role=${encodeURIComponent(role)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'text/event-stream' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`/query failed: ${response.status} ${response.statusText}`);
  }

  return response;
};

// ─── 2. complianceCheckAPI ───────────────────────────────────────────────────
// POST /compliance-check — returns compliance gap report
export const complianceCheckAPI = async (docName, topK = 8) => {
  const response = await fetch(`${BASE_URL}/compliance-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_name: docName, top_k: topK }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/compliance-check failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 3. rcaAPI ───────────────────────────────────────────────────────────────
// POST /rca — returns root cause analysis report
export const rcaAPI = async (incident, topK = 8) => {
  const response = await fetch(`${BASE_URL}/rca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incident, top_k: topK }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/rca failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 4. riskPulseAPI ─────────────────────────────────────────────────────────
// GET /risk-pulse — returns dynamic risk alerts
export const riskPulseAPI = async () => {
  const response = await fetch(`${BASE_URL}/risk-pulse`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/risk-pulse failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 5. auditPackAPI ─────────────────────────────────────────────────────────
// POST /audit-pack — returns compiled evidence package & download url
export const auditPackAPI = async (topic = 'PTW register OSD-110 compliance', topK = 10) => {
  const response = await fetch(`${BASE_URL}/audit-pack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, top_k: topK }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/audit-pack failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 6. graphAPI ────────────────────────────────────────────────────────────
// GET /graph — returns D3 knowledge graph structure
export const graphAPI = async () => {
  const response = await fetch(`${BASE_URL}/graph`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/graph failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 7. listDocsAPI ──────────────────────────────────────────────────────────
// GET /ingest/docs — returns list of unique uploaded docs in knowledge base
export const listDocsAPI = async () => {
  const response = await fetch(`${BASE_URL}/ingest/docs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.error || errorData?.detail || `/ingest/docs failed: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  return response.json();
};

// ─── 8. uploadDocAPI ─────────────────────────────────────────────────────────
// POST /ingest — uploads PDF or TXT to vector database
export const uploadDocAPI = async (file, docType = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (docType) {
    formData.append('doc_type', docType);
  }

  const response = await fetch(`${BASE_URL}/ingest`, {
    method: 'POST',
    body: formData, // browser automatically sets boundary & multipart headers
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    throw new Error(`/ingest failed: ${response.status} ${errorDetails.detail || response.statusText}`);
  }

  return response.json();
};