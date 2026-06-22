// src/components/layout/Sidebar.jsx
import React, { useRef } from 'react';

const NAV_ITEMS = [
  {
    id: 'chat',
    label: 'Copilot',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: 'graph',
    label: 'Knowledge Graph',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
  },
  {
    id: 'risk',
    label: 'Risk Pulse',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'pitch',
    label: 'Pitch Deck',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
];

export const Sidebar = ({ 
  activeNav, 
  onNavChange, 
  documents = [], 
  selectedDoc, 
  onSelectDoc, 
  onUpload, 
  loadingDocs 
}) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
    // Clear selection so upload of same file triggers again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="aura-sidebar">
      <style>{`
        .aura-sidebar {
          width: 240px;
          background-color: #0E1E35;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          border-right: 1px solid #E5E2DB;
          overflow-y: auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .sb-top {
          padding: 20px 16px 0;
        }

        .sb-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 28px;
        }

        .sb-logo-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #FFFFFF;
          text-transform: uppercase;
        }

        .sb-logo-dot {
          width: 6px;
          height: 6px;
          background-color: #C8521A;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sb-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          margin-bottom: 6px;
          padding: 0 12px;
        }

        .sb-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 28px;
        }

        .sb-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          border-left: 2px solid transparent;
          margin-left: -2px;
          transition: color 0.15s, background-color 0.15s, border-color 0.15s;
          background: none;
          border-right: none;
          border-top: none;
          border-bottom: none;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .sb-nav-item:hover {
          color: rgba(255,255,255,0.85);
          background-color: rgba(255,255,255,0.06);
        }

        .sb-nav-item.active {
          color: #FFFFFF;
          background-color: rgba(255,255,255,0.09);
          border-left-color: #C8521A;
        }

        .sb-nav-item.active .sb-nav-icon {
          color: #C8521A;
        }

        .sb-nav-icon {
          flex-shrink: 0;
          color: rgba(255,255,255,0.4);
          transition: color 0.15s;
          display: flex;
          align-items: center;
        }

        .sb-nav-item:hover .sb-nav-icon {
          color: rgba(255,255,255,0.7);
        }

        .sb-divider {
          height: 1px;
          background-color: rgba(255,255,255,0.08);
          margin: 0 16px 20px;
        }

        .sb-middle {
          padding: 0 16px;
          flex: 1;
        }

        .sb-recent {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 28px;
        }

        .sb-recent-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.15s;
          text-align: left;
        }

        .sb-recent-item:hover {
          background-color: rgba(255,255,255,0.06);
        }

        .sb-recent-item.selected {
          background-color: rgba(255, 255, 255, 0.09);
          border-left: 2px solid #C8521A;
          margin-left: -2px;
          padding-left: 10px;
        }

        .sb-recent-type {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.3);
          background-color: rgba(255,255,255,0.07);
          padding: 2px 4px;
          border-radius: 2px;
          flex-shrink: 0;
          width: 32px;
          text-align: center;
          text-transform: uppercase;
        }

        .sb-recent-label {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .sb-recent-item.selected .sb-recent-label {
          color: #FFFFFF;
          font-weight: 600;
        }

        .sb-bottom {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .sb-upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 9px 12px;
          background-color: rgba(200, 82, 26, 0.15);
          border: 1px solid rgba(200, 82, 26, 0.35);
          border-radius: 4px;
          color: #E8896A;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s, border-color 0.15s;
          font-family: inherit;
          letter-spacing: 0.3px;
        }

        .sb-upload-btn:hover {
          background-color: rgba(200, 82, 26, 0.25);
          border-color: rgba(200, 82, 26, 0.55);
          color: #F0A080;
        }

        .sb-upload-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .sb-plant-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          padding: 6px 8px;
          background-color: rgba(255,255,255,0.04);
          border-radius: 4px;
        }

        .sb-plant-dot {
          width: 5px;
          height: 5px;
          background-color: #10B981;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .sb-plant-name {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
        }

        /* Mobile: hide sidebar, show bottom bar */
        @media (max-width: 768px) {
          .aura-sidebar {
            width: 100%;
            height: 56px;
            flex-direction: row;
            align-items: center;
            padding: 0;
            border-right: none;
            border-top: 1px solid #E5E2DB;
            overflow: hidden;
          }

          .sb-top, .sb-middle, .sb-bottom, .sb-divider {
            display: none;
          }

          .sb-mobile-nav {
            display: flex !important;
            flex: 1;
            height: 100%;
          }
        }

        .sb-mobile-nav {
          display: none;
          align-items: stretch;
        }

        .sb-mobile-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          color: rgba(255,255,255,0.4);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-top: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          border-bottom: none;
          font-family: inherit;
        }

        .sb-mobile-nav-item:hover {
          color: rgba(255,255,255,0.7);
        }

        .sb-mobile-nav-item.active {
          color: #C8521A;
          border-top-color: #C8521A;
        }

        .sb-mobile-nav-item.active .sb-nav-icon {
          color: #C8521A;
        }
      `}</style>

      {/* Desktop layout */}
      <div className="sb-top">
        <div className="sb-logo">
          <span className="sb-logo-text">AURA</span>
          <div className="sb-logo-dot" />
        </div>

        <div className="sb-section-label">Navigation</div>
        <nav className="sb-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sb-nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => onNavChange(item.id)}
            >
              <span className="sb-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="sb-divider" />

      <div className="sb-middle">
        <div className="sb-section-label">Operational Knowledge</div>
        <div className="sb-recent">
          {loadingDocs ? (
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Loading index...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              No documents. Ingest one below.
            </div>
          ) : (
            documents.slice(0, 10).map(doc => {
              const isSelected = selectedDoc && selectedDoc.filename === doc.filename;
              return (
                <div 
                  key={doc.filename} 
                  className={`sb-recent-item${isSelected ? ' selected' : ''}`}
                  onClick={() => {
                    onSelectDoc(doc);
                    onNavChange('compliance'); // Auto navigate to compliance view
                  }}
                  title={doc.filename}
                >
                  <span className="sb-recent-type">{doc.doc_type}</span>
                  <span className="sb-recent-label">{doc.filename}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="sb-bottom">
        <div className="sb-plant-tag">
          <div className="sb-plant-dot" />
          <span className="sb-plant-name">Visakhapatnam Unit 2</span>
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          accept=".pdf,.txt"
          style={{ display: 'none' }}
        />

        <button className="sb-upload-btn" onClick={handleUploadClick}>
          <span className="sb-upload-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </span>
          Upload Document
        </button>
      </div>

      {/* Mobile bottom nav */}
      <div className="sb-mobile-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`sb-mobile-nav-item${activeNav === item.id ? ' active' : ''}`}
            onClick={() => onNavChange(item.id)}
          >
            <span className="sb-nav-icon">{item.icon}</span>
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;