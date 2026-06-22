import React, { useState, useEffect } from 'react';

const SLIDES = [
  {
    id: 'intro',
    title: 'AURA',
    subtitle: 'Asset Understanding & Response AI',
    tagline: 'The Next-Generation Safety & Operations Copilot for Industrial Plants',
    content: (
      <div className="slide-intro-content">
        <div className="radar-animation">
          <div className="radar-circle pulse-1"></div>
          <div className="radar-circle pulse-2"></div>
          <div className="radar-circle pulse-3"></div>
          <div className="radar-core">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </div>
        <p className="intro-description">
          Seamlessly ingesting complex Standard Operating Procedures (SOPs), Permits to Work (PTWs), and incident logs to deliver real-time compliance validation, voice-activated safety intelligence, and proactive risk analysis.
        </p>
        <div className="intro-meta">
          <span className="meta-badge">Enterprise AI</span>
          <span className="meta-badge">Zero-Incident Vision</span>
          <span className="meta-badge">Gemini-Powered</span>
        </div>
      </div>
    )
  },
  {
    id: 'problem',
    title: 'The Core Challenge',
    subtitle: 'Industrial Plant Operations Are Fragile & Siloed',
    content: (
      <div className="slide-problem-content">
        <div className="problem-grid">
          <div className="problem-card old-way">
            <h3>The Legacy Chaos</h3>
            <ul>
              <li>
                <span className="icon-cross">❌</span>
                <strong>Static PDF Manuals:</strong> Thousand-page SOPs sit unread in folders while crucial decisions are made on guess-work.
              </li>
              <li>
                <span className="icon-cross">❌</span>
                <strong>Disconnected Incident Logs:</strong> Lessons from past mechanical failures remain buried in outdated databases.
              </li>
              <li>
                <span className="icon-cross">❌</span>
                <strong>Manual Compliance Auditing:</strong> Reviewing Permits to Work (PTWs) takes hours of manual checking, inviting human errors.
              </li>
              <li>
                <span className="icon-cross">❌</span>
                <strong>Reactive Post-Mortems:</strong> Alerts only trigger after critical machinery shuts down or accidents occur.
              </li>
            </ul>
          </div>
          
          <div className="problem-card new-way">
            <h3>The AURA Paradigm</h3>
            <ul>
              <li>
                <span className="icon-check">✅</span>
                <strong>Instant Semantic Access:</strong> Unified query engine retrieves exact clauses across all documents in seconds.
              </li>
              <li>
                <span className="icon-check">✅</span>
                <strong>Connected Knowledge Graph:</strong> Incidents, assets, and safety criteria linked automatically.
              </li>
              <li>
                <span className="icon-check">✅</span>
                <strong>Automated Permitting Audits:</strong> AI parses PTWs against SOP guidelines to flag compliance gaps instantly.
              </li>
              <li>
                <span className="icon-check">✅</span>
                <strong>Proactive Risk Pulse Ticker:</strong> Continuous scanning of active telemetry and maintenance logs.
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'solution',
    title: 'The AURA Solution',
    subtitle: 'A Centralized Cognitive Hub for Plant Operators',
    content: (
      <div className="slide-solution-content">
        <p className="solution-overview">
          AURA provides a single, high-fidelity operations room interface, empowering field engineers, safety inspectors, and control room operators with:
        </p>
        <div className="solution-showcase">
          <div className="showcase-item">
            <div className="showcase-icon">💬</div>
            <h4>Natural Copilot</h4>
            <p>Voice and text chat driven by custom RAG, delivering answers linked directly to original source citations.</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-icon">🛡️</div>
            <h4>Compliance Engine</h4>
            <p>Immediate validation of dynamic permits. Auto-generates complete Word (.docx) Audit Packs for audits.</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-icon">🕸️</div>
            <h4>D3 Knowledge Graphs</h4>
            <p>Interactive force-directed relationships showing how physical assets, safety codes, and maintenance records link together.</p>
          </div>
          <div className="showcase-item">
            <div className="showcase-icon">🚨</div>
            <h4>Risk Pulse Monitoring</h4>
            <p>A scrolling ticker displaying severity-colored alerts about plant equipment failures, hot-work issues, and environment shifts.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'features',
    title: 'Key Capabilities & Features',
    subtitle: 'Explore AURA\'s Core Engine Options',
    interactive: true,
    content: (props) => {
      const [activeTab, setActiveTab] = useState('rag');
      return (
        <div className="slide-features-content">
          <div className="features-tabs">
            <button 
              className={`feat-tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
              onClick={() => setActiveTab('rag')}
            >
              RAG Copilot
            </button>
            <button 
              className={`feat-tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
              onClick={() => setActiveTab('compliance')}
            >
              Safety Compliance
            </button>
            <button 
              className={`feat-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
              onClick={() => setActiveTab('graph')}
            >
              D3 Network Engine
            </button>
          </div>

          <div className="features-display glass-panel">
            {activeTab === 'rag' && (
              <div className="tab-details animate-fade">
                <h4>Dynamic Persona-Tailored Retrieval</h4>
                <p>
                  AURA adapts its response based on the logged-in user profile. A <strong>Safety Officer</strong> receives comprehensive regulatory codes, a <strong>Field Technician</strong> receives quick physical steps and hazard warnings, and an <strong>Engineer</strong> receives operational specs.
                </p>
                <div className="mini-demo">
                  <div className="demo-chat-bubble query">"How should I inspect the flare stack gas leak?"</div>
                  <div className="demo-chat-bubble response">
                    <span className="persona-tag">Field Tech Persona</span>
                    "1. Isolate the pipeline feed line. 2. Wear chemical-resistant suits. 3. Monitor gas detector levels. [SOP-Section 4.2]"
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="tab-details animate-fade">
                <h4>Automated Permit-to-Work Gap Analysis</h4>
                <p>
                  Ingest newly uploaded permits in real-time. The compliance engine cross-checks isolation points, safety gear requirements, and hot-work conditions against global and plant-specific standards.
                </p>
                <div className="compliance-metrics">
                  <div className="comp-metric-card critical">
                    <span className="value">Critical Gap</span>
                    <span className="desc">Gas leak test missing on PTW #441</span>
                  </div>
                  <div className="comp-metric-card warning">
                    <span className="value">Isolation Gap</span>
                    <span className="desc">Electrical lock-out tag-out omitted</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'graph' && (
              <div className="tab-details animate-fade">
                <h4>Multi-Dimensional D3 Knowledge Mesh</h4>
                <p>
                  AURA parses incident logs to build an active knowledge mesh. It automatically links physical machinery (e.g., Boiler #2) to failure causes (e.g., gaskets), related standard guides, and personnel.
                </p>
                <div className="mini-graph-preview">
                  <div className="graph-node orange" style={{top: '20%', left: '30%'}}>Boiler #2</div>
                  <div className="graph-node blue" style={{top: '60%', left: '15%'}}>Leakage Incident</div>
                  <div className="graph-node gray" style={{top: '50%', left: '70%'}}>SOP-Boilers</div>
                  <div className="graph-line font-line-1"></div>
                  <div className="graph-line font-line-2"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    subtitle: 'High-Performance, Offline-First Security Ready',
    interactive: true,
    content: (props) => {
      const [flow, setFlow] = useState('query');
      return (
        <div className="slide-architecture-content">
          <div className="flow-controls">
            <button 
              className={`flow-btn ${flow === 'ingest' ? 'active' : ''}`}
              onClick={() => setFlow('ingest')}
            >
              Document Ingestion Flow
            </button>
            <button 
              className={`flow-btn ${flow === 'query' ? 'active' : ''}`}
              onClick={() => setFlow('query')}
            >
              User Query / RAG Flow
            </button>
          </div>

          <div className="arch-diagram glass-panel">
            {flow === 'ingest' ? (
              <div className="diagram-flow ingest-flow animate-fade">
                <div className="diagram-box client">
                  <h5>User Uploads Docs</h5>
                  <p>SOPs, PTWs, Manuals (.pdf, .txt)</p>
                </div>
                <div className="diagram-arrow">➔</div>
                <div className="diagram-box backend">
                  <h5>FastAPI + pypdf</h5>
                  <p>Text Extraction & Parsing</p>
                </div>
                <div className="diagram-arrow">➔</div>
                <div className="diagram-box embed">
                  <h5>Sentence Transformers</h5>
                  <p>MiniLM-L6 Vector Embeddings</p>
                </div>
                <div className="diagram-arrow">➔</div>
                <div className="diagram-box db">
                  <h5>ChromaDB Store</h5>
                  <p>Persistent Local Vector Index</p>
                </div>
              </div>
            ) : (
              <div className="diagram-flow query-flow animate-fade">
                <div className="diagram-box client">
                  <h5>Frontend Client</h5>
                  <p>React + SSE Stream Client</p>
                </div>
                <div className="diagram-arrow">⇄</div>
                <div className="diagram-box backend">
                  <h5>FastAPI Endpoints</h5>
                  <p>Router logic & Role customization</p>
                </div>
                <div className="diagram-arrow">⇄</div>
                <div className="diagram-box rag">
                  <h5>RAG Retriever</h5>
                  <p>Vector Search + Context builder</p>
                </div>
                <div className="diagram-arrow">⇄</div>
                <div className="diagram-box llm">
                  <h5>Gemini 1.5 Flash</h5>
                  <p>Token Streaming Reasoning</p>
                </div>
              </div>
            )}
          </div>
          <div className="arch-specs">
            <div className="spec-item"><strong>1M Tokens</strong> context window for massive reference files</div>
            <div className="spec-item"><strong>Offline Core</strong> embeddings run locally, protecting sensitive IP</div>
            <div className="spec-item"><strong>SSE Streaming</strong> token-by-token response for zero latency feel</div>
          </div>
        </div>
      );
    }
  },
  {
    id: 'traction',
    title: 'Market Value & Traction',
    subtitle: 'Empowering Heavy Industries Toward Zero Failure Rates',
    content: (
      <div className="slide-traction-content">
        <div className="traction-grid">
          <div className="traction-card">
            <span className="card-stat">90%</span>
            <h4>Audit Time Reduction</h4>
            <p>Permit inspection times slashed from hours to instant automatic gap check reports (.docx generation).</p>
          </div>
          <div className="traction-card">
            <span className="card-stat">100%</span>
            <h4>Compliance Traceability</h4>
            <p>Every response is back-linked directly to official regulations with clickable reference citations.</p>
          </div>
          <div className="traction-card font-orange-card">
            <span className="card-stat">Zero</span>
            <h4>Safety Oversights</h4>
            <p>Proactive hazard matching alerts team before field work begins, stopping accidents at the planning stage.</p>
          </div>
        </div>
        <div className="market-sectors">
          <h5>Target High-Hazard Sectors:</h5>
          <div className="sector-tags">
            <span>🛢️ Oil & Gas Refineries</span>
            <span>⚗️ Chemical Processing Plants</span>
            <span>⚡ Power Generation Grids</span>
            <span>🏗️ Heavy Manufacturing</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'vision',
    title: 'AURA Roadmap & Vision',
    subtitle: 'Unifying Operational Knowledge with Industrial Safety',
    content: (
      <div className="slide-vision-content">
        <div className="vision-quote-box glass-panel">
          <blockquote>
            "Our mission is to replace fragmented documentation with dynamic plant intelligence, ensuring every worker goes home safely, every day."
          </blockquote>
        </div>
        <div className="vision-timeline">
          <div className="time-node">
            <span className="time-label">Phase 1</span>
            <strong>Semantic Search & RAG</strong>
            <p>Seeded vector store, multi-persona chat, citation engine.</p>
          </div>
          <div className="time-node">
            <span className="time-label">Phase 2</span>
            <strong>Automated Audits & Graphs</strong>
            <p>D3 physical-safety link maps, Word report downloads, permit audits.</p>
          </div>
          <div className="time-node highlight">
            <span className="time-label">Phase 3</span>
            <strong>Telemetry & AI Agents</strong>
            <p>Real-time SCADA / PLC sensor feed inputs matched with automated safety responses.</p>
          </div>
        </div>
      </div>
    )
  }
];

export const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev < SLIDES.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="pitch-deck-container">
      <style>{`
        .pitch-deck-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #070F1E 0%, #0E1E35 100%);
          color: #E2E8F0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
          position: relative;
          padding: 30px;
          user-select: none;
        }

        /* Ambient glowing circles */
        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 1;
          opacity: 0.15;
          pointer-events: none;
        }

        .glow-1 {
          width: 400px;
          height: 400px;
          background: #C8521A;
          top: -100px;
          right: -100px;
        }

        .glow-2 {
          width: 500px;
          height: 500px;
          background: #1E3A8A;
          bottom: -150px;
          left: -150px;
        }

        .pitch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .pitch-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 2px;
          color: #FFFFFF;
        }

        .pitch-logo-dot {
          width: 6px;
          height: 6px;
          background-color: #C8521A;
          border-radius: 50%;
        }

        .pitch-badge {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          background-color: rgba(200, 82, 26, 0.2);
          border: 1px solid rgba(200, 82, 26, 0.4);
          padding: 4px 10px;
          border-radius: 20px;
          color: #FF8A50;
          font-weight: 600;
        }

        /* Slide Body */
        .pitch-slide-viewport {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
          position: relative;
        }

        .pitch-slide-card {
          width: 100%;
          max-width: 900px;
          height: 100%;
          max-height: 520px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          transition: transform 0.4s ease, opacity 0.4s ease;
          overflow-y: auto;
        }

        .slide-heading-zone {
          margin-bottom: 20px;
        }

        .slide-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #FFFFFF 0%, #B0C4DE 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .slide-subtitle {
          font-size: 15px;
          color: #FF8A50;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .slide-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Intro Slide CSS */
        .slide-intro-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .radar-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radar-circle {
          position: absolute;
          border: 1.5px solid rgba(200, 82, 26, 0.4);
          border-radius: 50%;
          animation: radarPulse 3s infinite linear;
        }

        .pulse-1 { width: 100%; height: 100%; animation-delay: 0s; }
        .pulse-2 { width: 100%; height: 100%; animation-delay: 1s; }
        .pulse-3 { width: 100%; height: 100%; animation-delay: 2s; }

        .radar-core {
          width: 44px;
          height: 44px;
          background-color: #C8521A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 20px rgba(200, 82, 26, 0.6);
        }

        @keyframes radarPulse {
          0% { transform: scale(0.4); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .intro-description {
          font-size: 15px;
          color: #94A3B8;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .intro-meta {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .meta-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #CBD5E1;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        /* Problem Slide CSS */
        .problem-grid {
          display: flex;
          gap: 20px;
          height: 100%;
        }

        .problem-card {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
        }

        .problem-card h3 {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .old-way h3 {
          color: #EF4444;
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
          padding-bottom: 8px;
        }

        .new-way h3 {
          color: #10B981;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          padding-bottom: 8px;
        }

        .problem-card ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .problem-card li {
          font-size: 12.5px;
          line-height: 1.5;
          color: #94A3B8;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .problem-card li strong {
          color: #E2E8F0;
        }

        .icon-cross, .icon-check {
          font-size: 11px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        /* Solution Slide CSS */
        .solution-overview {
          font-size: 14px;
          color: #94A3B8;
          margin-bottom: 20px;
          text-align: center;
        }

        .solution-showcase {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .showcase-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          transition: transform 0.2s, border-color 0.2s;
        }

        .showcase-item:hover {
          transform: translateY(-4px);
          border-color: rgba(200, 82, 26, 0.3);
          background: rgba(255, 255, 255, 0.03);
        }

        .showcase-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .showcase-item h4 {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 6px;
        }

        .showcase-item p {
          font-size: 11.5px;
          color: #94A3B8;
          line-height: 1.4;
        }

        /* Interactive Features Slide */
        .slide-features-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .features-tabs {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .feat-tab-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94A3B8;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .feat-tab-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.06);
        }

        .feat-tab-btn.active {
          background: #C8521A;
          color: #FFFFFF;
          border-color: #C8521A;
          box-shadow: 0 0 10px rgba(200, 82, 26, 0.3);
        }

        .features-display {
          min-height: 180px;
          padding: 20px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tab-details h4 {
          font-size: 15px;
          color: #FFFFFF;
          margin-bottom: 8px;
        }

        .tab-details p {
          font-size: 12.5px;
          color: #94A3B8;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .mini-demo {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0,0,0,0.2);
          padding: 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .demo-chat-bubble {
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11.5px;
          max-width: 85%;
        }

        .demo-chat-bubble.query {
          background: rgba(255,255,255,0.05);
          align-self: flex-end;
          color: #E2E8F0;
        }

        .demo-chat-bubble.response {
          background: rgba(200, 82, 26, 0.1);
          border: 1px solid rgba(200, 82, 26, 0.2);
          align-self: flex-start;
          color: #FF8A50;
        }

        .persona-tag {
          font-size: 9px;
          background: #C8521A;
          color: white;
          padding: 1px 4px;
          border-radius: 2px;
          margin-right: 6px;
          font-weight: 600;
        }

        .compliance-metrics {
          display: flex;
          gap: 15px;
        }

        .comp-metric-card {
          flex: 1;
          padding: 12px;
          border-radius: 6px;
          background: rgba(0,0,0,0.15);
          border-left: 3px solid transparent;
        }

        .comp-metric-card.critical {
          border-left-color: #EF4444;
        }

        .comp-metric-card.warning {
          border-left-color: #F59E0B;
        }

        .comp-metric-card .value {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .critical .value { color: #EF4444; }
        .warning .value { color: #F59E0B; }

        .comp-metric-card .desc {
          font-size: 12px;
          color: #E2E8F0;
        }

        .mini-graph-preview {
          position: relative;
          height: 100px;
          background: rgba(0,0,0,0.15);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.03);
        }

        .graph-node {
          position: absolute;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          z-index: 2;
        }

        .graph-node.orange { background: #C8521A; color: white; }
        .graph-node.blue { background: #1E3A8A; border: 1px solid #3B82F6; color: white; }
        .graph-node.gray { background: rgba(255,255,255,0.1); color: #CBD5E1; }

        .graph-line {
          position: absolute;
          height: 1px;
          background: rgba(255,255,255,0.1);
          z-index: 1;
          transform-origin: left center;
        }

        .font-line-1 {
          width: 140px;
          top: 35%;
          left: 32%;
          transform: rotate(45deg);
        }

        .font-line-2 {
          width: 150px;
          top: 35%;
          left: 32%;
          transform: rotate(-10deg);
        }

        /* Architecture Slide */
        .slide-architecture-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .flow-controls {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .flow-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94A3B8;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .flow-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .arch-diagram {
          padding: 24px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
        }

        .diagram-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .diagram-box {
          flex: 1;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .diagram-box.client { border-color: #3B82F6; }
        .diagram-box.backend { border-color: #10B981; }
        .diagram-box.embed { border-color: #F59E0B; }
        .diagram-box.db { border-color: #8B5CF6; }
        .diagram-box.llm { border-color: #EF4444; }

        .diagram-box h5 {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #FFFFFF;
        }

        .diagram-box p {
          font-size: 10px;
          color: #94A3B8;
          line-height: 1.3;
        }

        .diagram-arrow {
          color: rgba(255, 255, 255, 0.2);
          font-size: 16px;
          font-weight: bold;
        }

        .arch-specs {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .spec-item {
          flex: 1;
          font-size: 11.5px;
          color: #CBD5E1;
          background: rgba(255, 255, 255, 0.02);
          padding: 10px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          text-align: center;
        }

        .spec-item strong {
          color: #FF8A50;
          display: block;
          margin-bottom: 2px;
        }

        /* Traction Slide */
        .slide-traction-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .traction-grid {
          display: flex;
          gap: 15px;
        }

        .traction-card {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }

        .traction-card.font-orange-card {
          background: rgba(200, 82, 26, 0.05);
          border-color: rgba(200, 82, 26, 0.2);
        }

        .card-stat {
          display: block;
          font-size: 28px;
          font-weight: 800;
          color: #FF8A50;
          margin-bottom: 6px;
        }

        .font-orange-card .card-stat {
          color: #C8521A;
        }

        .traction-card h4 {
          font-size: 13.5px;
          color: #FFFFFF;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .traction-card p {
          font-size: 11.5px;
          color: #94A3B8;
          line-height: 1.4;
        }

        .market-sectors {
          text-align: center;
        }

        .market-sectors h5 {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .sector-tags {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .sector-tags span {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11.5px;
          color: #CBD5E1;
        }

        /* Vision & Timeline */
        .slide-vision-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .vision-quote-box {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .vision-quote-box blockquote {
          font-size: 14px;
          font-style: italic;
          color: #E2E8F0;
          line-height: 1.5;
        }

        .vision-timeline {
          display: flex;
          gap: 15px;
        }

        .time-node {
          flex: 1;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 15px;
          border-radius: 6px;
          position: relative;
        }

        .time-node.highlight {
          border-color: rgba(200, 82, 26, 0.3);
          background: rgba(200, 82, 26, 0.02);
        }

        .time-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #C8521A;
          margin-bottom: 6px;
        }

        .time-node strong {
          display: block;
          font-size: 12.5px;
          color: #FFFFFF;
          margin-bottom: 4px;
        }

        .time-node p {
          font-size: 11px;
          color: #94A3B8;
          line-height: 1.4;
        }

        /* Footer Controls */
        .pitch-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          z-index: 10;
        }

        .slide-dots {
          display: flex;
          gap: 6px;
        }

        .slide-dot {
          width: 8px;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .slide-dot:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }

        .slide-dot.active {
          background-color: #C8521A;
          transform: scale(1.25);
        }

        .pitch-nav-buttons {
          display: flex;
          gap: 10px;
        }

        .pitch-btn {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pitch-btn:hover:not(:disabled) {
          background: rgba(200, 82, 26, 0.2);
          border-color: #C8521A;
          color: #FF8A50;
        }

        .pitch-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .animate-fade {
          animation: fadeEffect 0.3s ease;
        }

        @keyframes fadeEffect {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Decorative Blur Backdrops */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      {/* Header */}
      <div className="pitch-header">
        <div className="pitch-logo">
          AURA
          <div className="pitch-logo-dot" />
        </div>
        <span className="pitch-badge">Product Pitch Deck</span>
      </div>

      {/* Viewport */}
      <div className="pitch-slide-viewport">
        <div className="pitch-slide-card">
          <div className="slide-heading-zone">
            <h2 className="slide-title">{slide.title}</h2>
            {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
          </div>

          <div className="slide-main-content">
            {typeof slide.content === 'function' ? slide.content() : slide.content}
          </div>
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="pitch-footer">
        <div className="slide-dots">
          {SLIDES.map((s, index) => (
            <button
              key={s.id}
              className={`slide-dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              title={`Slide ${index + 1}: ${s.title}`}
            />
          ))}
        </div>

        <div className="pitch-nav-buttons">
          <button 
            className="pitch-btn" 
            onClick={prevSlide} 
            disabled={currentSlide === 0}
            title="Previous Slide (←)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <button 
            className="pitch-btn" 
            onClick={nextSlide} 
            disabled={currentSlide === SLIDES.length - 1}
            title="Next Slide (→)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
