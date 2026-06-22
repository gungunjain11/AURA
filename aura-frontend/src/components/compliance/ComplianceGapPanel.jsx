// src/components/compliance/ComplianceGapPanel.jsx
import { useState, useEffect } from "react";
import { complianceCheckAPI, auditPackAPI } from "../../api/client";

const SEVERITY_STYLES = {
  Critical: {
    bg: "#FEF2F2",
    border: "#FECACA",
    badge: "#DC2626",
    badgeBg: "#FEE2E2",
    dot: "#DC2626",
  },
  Medium: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    badge: "#D97706",
    badgeBg: "#FEF3C7",
    dot: "#D97706",
  },
  Low: {
    bg: "#F7F6F3",
    border: "#E5E2DB",
    badge: "#6B6460",
    badgeBg: "#F0EDEA",
    dot: "#9CA3AF",
  },
};

const ComplianceGapPanel = ({ documents = [], selectedDoc, onSelectDoc }) => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditDone, setAuditDone] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!selectedDoc) {
      setGaps([]);
      return;
    }

    const fetchGaps = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await complianceCheckAPI(selectedDoc.filename);
        if (data.error) {
          setError(data.error);
          setGaps([]);
          return;
        }

        const rawGaps = data.gaps || [];
        const mappedGaps = rawGaps.map((g, idx) => ({
          id: g.id || `GAP-${idx + 1}`,
          regulation: g.clause || 'Regulatory Standard',
          description: g.description || 'Non-compliance detected.',
          recommendation: g.recommendation || '',
          severity: g.severity === 'CRITICAL' ? 'Critical' : (g.severity === 'WARNING' ? 'Medium' : 'Low')
        }));
        setGaps(mappedGaps);
      } catch (err) {
        console.error('Failed to run compliance check:', err);
        setError('Could not run compliance gap analysis.');
        setGaps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGaps();
  }, [selectedDoc]);

  const handleAuditPack = async () => {
    if (!selectedDoc) return;
    setAuditLoading(true);
    try {
      const topic = `Compliance audit check for ${selectedDoc.filename}`;
      const result = await auditPackAPI(topic);
      if (result.docx_download_url) {
        // Download generated DOCX report
        window.open(`http://localhost:8000${result.docx_download_url}`, '_blank');
      }
      setAuditDone(true);
      setTimeout(() => setAuditDone(false), 3000);
    } catch (err) {
      console.error('Failed to generate audit pack:', err);
      alert('Failed to generate audit pack: ' + err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const severityCounts = gaps.reduce((acc, g) => {
    acc[g.severity] = (acc[g.severity] || 0) + 1;
    return acc;
  }, {});

  const filteredGaps = filter === "All"
    ? gaps
    : gaps.filter((g) => g.severity === filter);

  const filters = ["All", "Critical", "Medium", "Low"];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Document selector dropdown */}
      <div style={{
        padding: "12px 16px 8px 16px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E2DB",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flexShrink: 0
      }}>
        <label style={{ fontSize: "9px", fontWeight: 700, color: "#6B6460", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Selected Document
        </label>
        <select
          value={selectedDoc ? selectedDoc.filename : ""}
          onChange={(e) => {
            const doc = documents.find(d => d.filename === e.target.value);
            if (doc && onSelectDoc) onSelectDoc(doc);
          }}
          style={{
            padding: "8px 10px",
            fontSize: "12px",
            fontFamily: "'Inter', sans-serif",
            border: "1px solid #E5E2DB",
            borderRadius: "4px",
            color: "#0E1E35",
            background: "#F7F6F3",
            fontWeight: 600,
            outline: "none",
            cursor: "pointer"
          }}
        >
          {documents.length === 0 ? (
            <option value="">No documents available</option>
          ) : (
            documents.map(d => (
              <option key={d.filename} value={d.filename}>
                {d.filename} ({d.doc_type})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Summary counts bar */}
      <div style={{
        padding: "12px 16px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E2DB",
        display: "flex",
        gap: "10px",
        flexShrink: 0,
      }}>
        {["Critical", "Medium", "Low"].map((sev) => (
          <div key={sev} style={{
            flex: 1,
            background: SEVERITY_STYLES[sev].badgeBg,
            border: `1px solid ${SEVERITY_STYLES[sev].border}`,
            borderRadius: "4px",
            padding: "6px 8px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: SEVERITY_STYLES[sev].badge,
              lineHeight: 1,
            }}>
              {severityCounts[sev] || 0}
            </div>
            <div style={{
              fontSize: "9px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: SEVERITY_STYLES[sev].badge,
              marginTop: "2px",
            }}>
              {sev}
            </div>
          </div>
        ))}
      </div>

      {/* Audit pack button */}
      <div style={{
        padding: "10px 16px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E2DB",
        flexShrink: 0,
      }}>
        <button
          onClick={handleAuditPack}
          disabled={auditLoading || !selectedDoc}
          style={{
            width: "100%",
            padding: "9px 16px",
            background: auditDone ? "#10B981" : "#0E1E35",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: (auditLoading || !selectedDoc) ? "not-allowed" : "pointer",
            fontFamily: "'Inter', system-ui, sans-serif",
            transition: "background 0.3s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            opacity: (auditLoading || !selectedDoc) ? 0.7 : 1,
          }}
        >
          {auditLoading ? (
            <>
              <span style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#FFFFFF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Generating...
            </>
          ) : auditDone ? (
            "✓ Audit Pack Downloaded"
          ) : (
            "Generate Audit Pack"
          )}
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex",
        padding: "0 16px",
        background: "#F7F6F3",
        borderBottom: "1px solid #E5E2DB",
        gap: "0",
        flexShrink: 0,
      }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 10px",
              border: "none",
              borderBottom: filter === f ? "2px solid #C8521A" : "2px solid transparent",
              background: "transparent",
              fontSize: "11px",
              fontWeight: 600,
              color: filter === f ? "#C8521A" : "#6B6460",
              cursor: "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "color 0.2s, border-color 0.2s",
              letterSpacing: "0.04em",
            }}
          >
            {f}
            {f !== "All" && severityCounts[f] ? (
              <span style={{
                marginLeft: "4px",
                background: SEVERITY_STYLES[f].badgeBg,
                color: SEVERITY_STYLES[f].badge,
                borderRadius: "8px",
                padding: "0px 5px",
                fontSize: "10px",
              }}>
                {severityCounts[f]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Gap list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        scrollbarWidth: "thin",
        scrollbarColor: "#E5E2DB transparent",
      }}>
        {loading ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: "80px",
                background: "#FFFFFF",
                borderRadius: "4px",
                border: "1px solid #E5E2DB",
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "#DC2626",
            fontSize: "12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "4px",
            lineHeight: 1.5
          }}>
            {error}
          </div>
        ) : filteredGaps.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "32px 16px",
            color: "#6B6460",
            fontSize: "13px",
            fontStyle: "italic"
          }}>
            {!selectedDoc ? "Select a document to begin analysis." : `No gaps identified in "${selectedDoc.filename}".`}
          </div>
        ) : (
          filteredGaps.map((gap) => {
            const s = SEVERITY_STYLES[gap.severity] || SEVERITY_STYLES.Low;
            return (
              <div
                key={gap.id}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: "4px",
                  padding: "12px",
                  borderLeft: `3px solid ${s.badge}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                }}
              >
                {/* Regulation + badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#0E1E35",
                    letterSpacing: "0.05em",
                  }}>
                    {gap.regulation}
                  </span>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: s.badge,
                    background: s.badgeBg,
                    border: `1px solid ${s.border}`,
                    borderRadius: "3px",
                    padding: "2px 6px",
                  }}>
                    {gap.severity}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: "12px",
                  color: "#1A1A1A",
                  lineHeight: "1.5",
                  margin: 0,
                }}>
                  {gap.description}
                </p>

                {/* Recommendation */}
                {gap.recommendation && (
                  <div style={{
                    marginTop: "8px",
                    padding: "6px 10px",
                    background: "rgba(255, 255, 255, 0.65)",
                    borderLeft: "2px solid #10B981",
                    borderRadius: "2px",
                    fontSize: "11px",
                    color: "#4A4542",
                    lineHeight: "1.45"
                  }}>
                    <strong style={{ color: "#0E1E35" }}>Action:</strong> {gap.recommendation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export { ComplianceGapPanel };
export default ComplianceGapPanel;