// src/components/graph/KnowledgeGraph.jsx
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { graphAPI } from "../../api/client";

const defaultNodes = [
  { id: "1", label: "Gas Detector A1", type: "equipment" },
  { id: "2", label: "Gas Detector B2", type: "equipment" },
  { id: "3", label: "Pump P-101", type: "equipment" },
  { id: "4", label: "Compressor C-201", type: "equipment" },
  { id: "5", label: "OISD-116 SOP", type: "document" },
  { id: "6", label: "PTW Manual", type: "document" },
  { id: "7", label: "Maintenance Log 2024", type: "document" },
  { id: "8", label: "Incident Report #47", type: "document" },
  { id: "9", label: "Gas Leak Risk", type: "risk" },
  { id: "10", label: "Pressure Overload", type: "risk" },
  { id: "11", label: "Unplanned Downtime", type: "risk" },
];

const defaultLinks = [
  { source: "1", target: "5" },
  { source: "2", target: "5" },
  { source: "3", target: "6" },
  { source: "4", target: "6" },
  { source: "5", target: "9" },
  { source: "6", target: "10" },
  { source: "7", target: "11" },
  { source: "8", target: "9" },
  { source: "1", target: "9" },
  { source: "3", target: "10" },
  { source: "4", target: "11" },
];

const NODE_COLORS = {
  equipment: "#0E1E35",  // navy — matches sidebar
  document: "#1D9E75",   // teal
  risk: "#C8521A",       // burnt orange — matches accent
};

const NODE_RADIUS = {
  equipment: 10,
  document: 8,
  risk: 9,
};

const KnowledgeGraph = ({ onNodeClick }) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live knowledge graph
  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await graphAPI();
        if (data.nodes && data.nodes.length > 0) {
          setGraphData({
            nodes: data.nodes,
            links: data.links || []
          });
        } else {
          // Empty graph returned — fallback to seed mocks
          setGraphData({ nodes: defaultNodes, links: defaultLinks });
        }
      } catch (err) {
        console.error("Failed to load graph from API:", err);
        setError("API load failed, rendering offline structure.");
        setGraphData({ nodes: defaultNodes, links: defaultLinks });
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const { nodes, links } = graphData;
    if (nodes.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container.clientWidth || 280;
    const height = container.clientHeight || 400;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Zoom + pan
    const zoomGroup = svg.append("g");

    svg.call(
      d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          zoomGroup.attr("transform", event.transform);
        })
    );

    // Deep-clone links so D3 mutation doesn't corrupt original
    const linkData = links.map((l) => ({ ...l }));
    const nodeData = nodes.map((n) => ({ ...n }));

    // Force simulation
    simulationRef.current = d3.forceSimulation(nodeData)
      .force("link", d3.forceLink(linkData).id((d) => d.id).distance(80).strength(0.8))
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(24));

    // Links
    const link = zoomGroup.append("g")
      .selectAll("line")
      .data(linkData)
      .join("line")
      .attr("stroke", "#E5E2DB")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8);

    // Node groups
    const node = zoomGroup.append("g")
      .selectAll("g")
      .data(nodeData)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        // Pulse animation on click
        d3.select(event.currentTarget)
          .select("circle")
          .transition().duration(100).attr("r", NODE_RADIUS[d.type] * 1.6)
          .transition().duration(200).attr("r", NODE_RADIUS[d.type]);

        if (onNodeClick) onNodeClick(d.label);
      });

    // Circle
    node.append("circle")
      .attr("r", (d) => NODE_RADIUS[d.type] || 8)
      .attr("fill", (d) => NODE_COLORS[d.type] || "#6B6460")
      .attr("stroke", "#F7F6F3")
      .attr("stroke-width", 2);

    // Label
    node.append("text")
      .text((d) => d.label.length > 18 ? d.label.slice(0, 17) + "…" : d.label)
      .attr("dy", (d) => (NODE_RADIUS[d.type] || 8) + 11)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("font-family", "'Inter', system-ui, sans-serif")
      .attr("font-weight", 500)
      .attr("fill", "#1A1A1A")
      .style("pointer-events", "none")
      .style("user-select", "none");

    // Tick
    simulationRef.current.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [graphData]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: "380px",
      background: "#F7F6F3",
    }}>
      {/* Legend */}
      <div style={{
        display: "flex",
        gap: "12px",
        padding: "12px 16px",
        borderBottom: "1px solid #E5E2DB",
        background: "#FFFFFF",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "capitalize",
              letterSpacing: "0.05em",
              color: "#6B6460",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Hint / Status */}
      <div style={{
        padding: "6px 16px",
        background: "#F7F6F3",
        borderBottom: "1px solid #E5E2DB",
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between"
      }}>
        <span style={{
          fontSize: "10px",
          color: "#6B6460",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Click a node to query · Drag to explore
        </span>
        {error && (
          <span style={{
            fontSize: "10px",
            color: "#D97706",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 500
          }}>
            {error}
          </span>
        )}
      </div>

      {/* D3 canvas */}
      <div style={{
        flex: 1,
        overflow: "hidden",
        position: "relative",
      }}>
        {loading && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(247, 246, 243, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#6B6460",
            fontWeight: 600,
            zIndex: 5
          }}>
            Loading knowledge graph...
          </div>
        )}
        <svg
          ref={svgRef}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};

export { KnowledgeGraph };
export default KnowledgeGraph;