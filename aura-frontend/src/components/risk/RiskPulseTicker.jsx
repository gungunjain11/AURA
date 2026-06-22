import { useState, useEffect, useRef } from "react";
import { riskPulseAPI } from "../../api/client";

// NOTE: keys updated to match client.js contract:
// [{ id, title, equipmentTag, timestamp, severity: 'Critical' | 'High' | 'Medium' }]
const mockAlerts = [
  {
    id: 1,
    title: "Gas concentration above threshold",
    equipmentTag: "GD-A1-U2",
    timestamp: "09:42 AM",
    severity: "Critical",
  },
  {
    id: 2,
    title: "Pressure spike detected",
    equipmentTag: "Compressor C-201",
    timestamp: "09:31 AM",
    severity: "Critical",
  },
  {
    id: 3,
    title: "Vibration anomaly detected",
    equipmentTag: "Pump P-101",
    timestamp: "09:18 AM",
    severity: "Medium",
  },
  {
    id: 4,
    title: "Temperature rising in Zone 3",
    equipmentTag: "HX-301",
    timestamp: "08:55 AM",
    severity: "Medium",
  },
];

// ← FIX: added 'High' so it doesn't silently fall back to Medium styling
const SEVERITY_COLORS = {
  Critical: {
    dot: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#DC2626",
    pulse: "rgba(220, 38, 38, 0.3)",
  },
  High: {
    dot: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
    text: "#EA580C",
    pulse: "rgba(234, 88, 12, 0.3)",
  },
  Medium: {
    dot: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#D97706",
    pulse: "rgba(217, 119, 6, 0.3)",
  },
};

const RiskPulseTicker = ({ alerts: externalAlerts }) => {
  const [alerts, setAlerts] = useState(externalAlerts?.length ? externalAlerts : mockAlerts);
  const [newAlertIds, setNewAlertIds] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const intervalRef = useRef(null);
  const prevAlertsRef = useRef(alerts);

  const mapBackendAlerts = (rawList) => {
    const list = rawList.alerts || rawList || [];
    return list.map(alert => ({
      id: alert.alert_id || alert.id,
      title: alert.title,
      equipmentTag: alert.equipment || alert.equipmentTag || 'General',
      timestamp: alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
      severity: alert.severity === 'CRITICAL' ? 'Critical' : (alert.severity === 'HIGH' ? 'High' : 'Medium'),
      description: alert.description || '',
      recommendedAction: alert.recommended_action || ''
    }));
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await riskPulseAPI();
        const mappedData = mapBackendAlerts(data);
        if (mappedData && mappedData.length) {
          const prev = prevAlertsRef.current;
          const prevIds = new Set(prev.map((a) => a.id));
          const incoming = mappedData.filter((a) => !prevIds.has(a.id));

          if (incoming.length) {
            setNewAlertIds(new Set(incoming.map((a) => a.id)));
            setTimeout(() => setNewAlertIds(new Set()), 2000);
          }

          setAlerts(mappedData);
          prevAlertsRef.current = mappedData;
        }
      } catch (err) {
        console.error("Risk Pulse polling failed:", err);
      }
    };

    poll(); // run immediately on load
    intervalRef.current = setInterval(poll, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Sync if parent passes alerts externally
  useEffect(() => {
    if (externalAlerts?.length) {
      setAlerts(mapBackendAlerts(externalAlerts));
    }
  }, [externalAlerts]);

  const criticalCount = alerts.filter((a) => a.severity === "Critical").length;
  const highCount = alerts.filter((a) => a.severity === "High").length;
  const mediumCount = alerts.filter((a) => a.severity === "Medium").length;

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      borderBottom: "1px solid #E5E2DB",
      background: "#FFFFFF",
    }}>

      {/* Ticker header bar */}
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "6px 16px",
          gap: "10px",
          cursor: "pointer",
          userSelect: "none",
          background: criticalCount > 0 ? "#FEF2F2" : "#FFFFFF",
          borderBottom: collapsed ? "none" : "1px solid #E5E2DB",
          transition: "background 0.3s",
        }}
      >
        {/* Live pulse dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: criticalCount > 0 ? "#DC2626" : "#D97706",
          }} />
          <div style={{
            position: "absolute",
            top: "-3px",
            left: "-3px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: criticalCount > 0
              ? "rgba(220, 38, 38, 0.25)"
              : "rgba(217, 119, 6, 0.25)",
            animation: "riskPulse 1.8s ease-out infinite",
          }} />
        </div>

        {/* Label */}
        <span style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: criticalCount > 0 ? "#DC2626" : "#D97706",
        }}>
          Risk Pulse
        </span>

        {/* Counts */}
        <div style={{ display: "flex", gap: "6px", marginLeft: "2px" }}>
          {criticalCount > 0 && (
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "#FEE2E2",
              color: "#DC2626",
              border: "1px solid #FECACA",
              borderRadius: "3px",
              padding: "1px 6px",
            }}>
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "#FFEDD5",
              color: "#EA580C",
              border: "1px solid #FED7AA",
              borderRadius: "3px",
              padding: "1px 6px",
            }}>
              {highCount} High
            </span>
          )}
          {mediumCount > 0 && (
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              background: "#FEF3C7",
              color: "#D97706",
              border: "1px solid #FDE68A",
              borderRadius: "3px",
              padding: "1px 6px",
            }}>
              {mediumCount} Medium
            </span>
          )}
        </div>

        {/* Spacer + collapse toggle */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "10px",
            color: "#6B6460",
          }}>
            Polls every 30s
          </span>
          <span style={{
            fontSize: "12px",
            color: "#6B6460",
            transform: collapsed ? "rotate(-90deg)" : "rotate(90deg)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}>
            ›
          </span>
        </div>
      </div>

      {/* Alert cards — collapsible */}
      {!collapsed && (
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "8px 16px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {alerts.length === 0 ? (
            <div style={{
              fontSize: "12px",
              color: "#6B6460",
              padding: "4px 0",
              fontStyle: "italic",
            }}>
              No active risk signals
            </div>
          ) : (
            alerts.map((alert) => {
              const s = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.Medium;
              const isNew = newAlertIds.has(alert.id);

              return (
                <div
                  key={alert.id}
                  style={{
                    flexShrink: 0,
                    minWidth: "200px",
                    maxWidth: "240px",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderLeft: `3px solid ${s.dot}`,
                    borderRadius: "4px",
                    padding: "8px 10px",
                    animation: isNew ? "slideIn 0.35s ease-out" : "none",
                  }}
                >
                  {/* Severity + timestamp */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      <div style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: s.dot,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: s.text,
                      }}>
                        {alert.severity}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "9px",
                      color: "#6B6460",
                      fontWeight: 500,
                    }}>
                      {alert.timestamp}
                    </span>
                  </div>

                  {/* Title */}
                  <div style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    lineHeight: "1.4",
                    marginBottom: "4px",
                  }}>
                    {alert.title}
                  </div>

                  {/* Equipment tag — FIX: was alert.equipment, client.js sends equipmentTag */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    background: "#F7F6F3",
                    border: "1px solid #E5E2DB",
                    borderRadius: "3px",
                    padding: "2px 6px",
                  }}>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "#0E1E35",
                      letterSpacing: "0.05em",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {alert.equipmentTag}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes riskPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export { RiskPulseTicker };
export default RiskPulseTicker;