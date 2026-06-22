import { useState } from "react";
import ComplianceGapPanel from "../compliance/ComplianceGapPanel";
import KnowledgeGraph from "../graph/KnowledgeGraph";

const RightPanel = ({ activeNav, onNavChange, selectedDoc, onSelectDoc, documents }) => {
  const [activeTab, setActiveTab] = useState("compliance");

  return (
    <div style={{
      width: "320px",
      minWidth: "280px",
      height: "100%",
      background: "#FFFFFF",
      borderLeft: "1px solid #E5E2DB",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      flexShrink: 0,
    }}>

      {/* Panel Header */}
      <div style={{
        borderBottom: "1px solid #E5E2DB",
        background: "#FFFFFF",
        flexShrink: 0,
      }}>
        <span style={{
          display: "block",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#6B6460",
          padding: "14px 16px 10px 16px",
        }}>
          Intelligence Panel
        </span>

        {/* Tabs */}
        <div style={{
          display: "flex",
          padding: "0 16px",
          gap: "4px",
        }}>
          {["compliance", "graph"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "9px 8px",
                border: "none",
                borderBottom: activeTab === tab
                  ? "2px solid #C8521A"
                  : "2px solid transparent",
                background: "transparent",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: activeTab === tab ? "#C8521A" : "#6B6460",
                cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
                marginBottom: "-1px",
              }}
            >
              {tab === "compliance" ? "Compliance" : "Graph"}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        background: "#F7F6F3",
        scrollbarWidth: "thin",
        scrollbarColor: "#E5E2DB transparent",
      }}>
        {activeTab === "compliance" ? (
          <ComplianceGapPanel 
            selectedDoc={selectedDoc}
            onSelectDoc={onSelectDoc}
            documents={documents}
          />
        ) : (
          <KnowledgeGraph
            onNodeClick={(label) => {
              // Bubble up to chat if needed
              if (onNavChange) onNavChange("chat");
            }}
          />
        )}
      </div>

      {/* Footer status strip */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid #E5E2DB",
        background: "#FFFFFF",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexShrink: 0,
      }}>
        <div style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "#10B981",
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: "11px",
          color: "#6B6460",
          fontWeight: 500,
        }}>
          {activeTab === "compliance"
            ? "Compliance data synced"
            : "Knowledge graph loaded"}
        </span>
      </div>
    </div>
  );
};

export { RightPanel };
export default RightPanel;