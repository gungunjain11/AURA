import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ChatWindow } from './components/layout/ChatWindow';
import { RightPanel } from './components/layout/RightPanel';
import { RiskPulseTicker } from './components/risk/RiskPulseTicker';
import { PitchDeck } from './components/layout/PitchDeck';
import { listDocsAPI, uploadDocAPI } from './api/client';

const App = () => {
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [activeNav, setActiveNav] = useState('chat');
  
  // Dynamic document management
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Active query persona/role state
  const [role, setRole] = useState('engineer'); // 'engineer' | 'safety_officer' | 'field_tech'

  const fetchDocuments = useCallback(async (shouldSelectDefault = false) => {
    setLoadingDocs(true);
    try {
      const data = await listDocsAPI();
      const docs = data.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && (shouldSelectDefault || !selectedDoc)) {
        // Default to a PTW or SOP if available, otherwise first doc
        const defaultDoc = docs.find(d => d.doc_type === 'PTW') || docs.find(d => d.doc_type === 'SOP') || docs[0];
        setSelectedDoc(defaultDoc);
      }
    } catch (err) {
      console.error('Failed to load documents from backend:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedDoc]);

  // Load documents on mount
  useEffect(() => {
    fetchDocuments(true);
  }, []);

  // Handle local document upload
  const handleUploadDocument = async (file) => {
    try {
      let inferredType = 'GENERAL';
      const nameLower = file.name.toLowerCase();
      if (nameLower.includes('sop')) inferredType = 'SOP';
      else if (nameLower.includes('ptw') || nameLower.includes('permit')) inferredType = 'PTW';
      else if (nameLower.includes('incident')) inferredType = 'INCIDENT_LOG';
      else if (nameLower.includes('maintenance')) inferredType = 'MAINTENANCE';
      else if (nameLower.includes('regulatory') || nameLower.includes('standard') || nameLower.includes('oisd') || nameLower.includes('osd')) inferredType = 'REGULATORY';
      else if (nameLower.includes('oem') || nameLower.includes('manual')) inferredType = 'OEM_MANUAL';

      await uploadDocAPI(file, inferredType);
      
      // Refresh documents and set newly uploaded as selected
      const data = await listDocsAPI();
      const docs = data.documents || [];
      setDocuments(docs);
      const newlyUploaded = docs.find(d => d.filename === file.name);
      if (newlyUploaded) {
        setSelectedDoc(newlyUploaded);
      }
      
      alert(`Successfully ingested "${file.name}" into the AURA knowledge base!`);
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert(`Document ingestion failed: ${err.message}`);
    }
  };

  return (
    <div className="aura-app">
      <style>{`
        :root {
          --color-bg-primary: #F7F6F3;
          --color-bg-secondary: #FFFFFF;
          --color-sidebar: #0E1E35;
          --color-accent: #C8521A;
          --color-text-primary: #1A1A1A;
          --color-text-muted: #6B6460;
          --color-border: #E5E2DB;
          --color-status-green: #10B981;
          --sidebar-width: 240px;
          --right-panel-width: 320px;
          --header-height: 48px;
          --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          --border-radius: 4px;
          --shadow-light: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: var(--font-family);
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
        }

        .aura-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background-color: var(--color-bg-primary);
        }

        /* Header */
        .aura-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--header-height);
          padding: 0 24px;
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .aura-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 1px;
          color: var(--color-sidebar);
        }

        .aura-header-dot {
          width: 8px;
          height: 8px;
          background-color: var(--color-accent);
          border-radius: 50%;
        }

        .aura-header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-size: 13px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .aura-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-primary);
          font-weight: 500;
          background-color: var(--color-bg-primary);
          padding: 4px 12px;
          border-radius: var(--border-radius);
        }

        .aura-status-dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-status-green);
          border-radius: 50%;
        }

        /* Main layout */
        .aura-main-container {
          display: flex;
          flex: 1;
          overflow: hidden;
          gap: 0;
        }

        /* Sidebar */
        .aura-sidebar {
          width: var(--sidebar-width);
          background-color: var(--color-sidebar);
          color: white;
          padding: 24px 16px;
          overflow-y: auto;
          flex-shrink: 0;
          border-right: 1px solid var(--color-border);
        }

        .aura-sidebar-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 32px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
        }

        .aura-sidebar-dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-accent);
          border-radius: 50%;
        }

        .aura-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .aura-nav-item {
          display: flex;
          align-items: center;
          padding: 12px 12px;
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: background-color 0.2s, border-color 0.2s;
          border-left: 2px solid transparent;
          margin-left: -2px;
          color: rgba(255, 255, 255, 0.8);
        }

        .aura-nav-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .aura-nav-item.active {
          background-color: rgba(255, 255, 255, 0.1);
          border-left-color: var(--color-accent);
          color: white;
        }

        /* Chat window center */
        .aura-chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--color-bg-primary);
          overflow: hidden;
        }

        .aura-risk-ticker {
          flex-shrink: 0;
          background-color: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }

        .aura-chat-content {
          flex: 1;
          overflow: hidden;     /* ChatWindow manages its own scroll internally */
          display: flex;
          flex-direction: column;
        }


        /* Right panel */
        .aura-right-panel {
          width: var(--right-panel-width);
          background-color: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
        }

        .aura-panel-tabs {
          display: flex;
          gap: 0;
          padding: 0;
          background-color: var(--color-bg-primary);
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .aura-panel-tab {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          font-family: var(--font-family);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          text-align: center;
        }

        .aura-panel-tab:hover {
          color: var(--color-text-primary);
        }

        .aura-panel-tab.active {
          color: var(--color-accent);
          border-bottom-color: var(--color-accent);
        }

        .aura-panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        /* Scrollbar styling */
        .aura-sidebar::-webkit-scrollbar,
        .aura-chat-content::-webkit-scrollbar,
        .aura-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .aura-sidebar::-webkit-scrollbar-track,
        .aura-chat-content::-webkit-scrollbar-track,
        .aura-panel-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .aura-sidebar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .aura-sidebar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        .aura-chat-content::-webkit-scrollbar-thumb,
        .aura-panel-content::-webkit-scrollbar-thumb {
          background-color: var(--color-border);
          border-radius: 3px;
        }

        .aura-chat-content::-webkit-scrollbar-thumb:hover,
        .aura-panel-content::-webkit-scrollbar-thumb:hover {
          background-color: var(--color-text-muted);
          border-radius: 3px;
        }

        /* Mobile responsive */
        @media (max-width: 1024px) {
          .aura-right-panel {
            width: 280px;
          }

          .aura-sidebar {
            width: 200px;
          }
        }

        @media (max-width: 768px) {
          .aura-main-container {
            flex-direction: column;
          }

          .aura-sidebar {
            width: 100%;
            height: 60px;
            padding: 0;
            display: flex;
            align-items: center;
            border-right: none;
            border-top: 1px solid var(--color-border);
            order: 2;
          }

          .aura-sidebar-header {
            margin-bottom: 0;
            margin-right: 16px;
          }

          .aura-nav {
            flex-direction: row;
            gap: 0;
            flex: 1;
          }

          .aura-nav-item {
            flex: 1;
            justify-content: center;
            border-left: none;
            border-bottom: 2px solid transparent;
            margin-left: 0;
            padding: 12px 8px;
            border-radius: 0;
            font-size: 11px;
          }

          .aura-nav-item.active {
            border-bottom-color: var(--color-accent);
            border-left-color: transparent;
          }

          .aura-right-panel {
            width: 100%;
            height: 40%;
            border-left: none;
            border-top: 1px solid var(--color-border);
            order: 1;
          }

          .aura-chat-container {
            order: 1;
            flex-basis: 60%;
          }

          .aura-header-center {
            display: none;
          }

          .aura-header {
            padding: 0 16px;
          }
        }

        @media (max-width: 480px) {
          .aura-header {
            height: 44px;
            padding: 0 12px;
          }

          .aura-header-left {
            font-size: 12px;
            gap: 4px;
          }

          .aura-header-right {
            font-size: 10px;
            padding: 2px 8px;
          }

          .aura-chat-input-area {
            padding: 12px 12px;
          }

          .aura-sidebar {
            height: 50px;
          }

          .aura-right-panel {
            height: 35%;
          }

          .aura-chat-container {
            flex-basis: 65%;
          }
        }
      `}</style>

      {/* Header */}
      <header className="aura-header">
        <div className="aura-header-left">
          AURA
          <div className="aura-header-dot"></div>
        </div>
        <div className="aura-header-center">
          Visakhapatnam Unit 2
        </div>
        <div className="aura-header-right">
          <div className="aura-status-dot"></div>
          All systems nominal
        </div>
      </header>

      {/* Main container */}
      <div className="aura-main-container">
        {/* Sidebar */}
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          documents={documents}
          selectedDoc={selectedDoc}
          onSelectDoc={setSelectedDoc}
          onUpload={handleUploadDocument}
          loadingDocs={loadingDocs}
        />
        {activeNav === 'pitch' ? (
          <PitchDeck />
        ) : (
          <>
            {/* Chat container (center) */}
            <div className="aura-chat-container">
              <div className="aura-risk-ticker">
                <RiskPulseTicker alerts={riskAlerts} />
              </div>

              <div className="aura-chat-content">
                <ChatWindow 
                  activeNav={activeNav} 
                  role={role}
                  onRoleChange={setRole}
                />
              </div>
            </div>

            {/* Right panel */}
            <RightPanel
              activeNav={activeNav}
              onNavChange={setActiveNav}
              documents={documents}
              selectedDoc={selectedDoc}
              onSelectDoc={setSelectedDoc}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;