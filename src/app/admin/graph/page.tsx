"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { GitCommit, HelpCircle, RefreshCw, Cpu } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "student" | "teacher" | "class" | "subject";
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

export default function AdminGraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const res = await fetch("/api/admin/graph");
      if (!res.ok) throw new Error("Failed to load Knowledge Graph data");
      const json = await res.json();

      // Layout nodes into clean columns:
      // Column 0: Teachers
      // Column 1: Classes
      // Column 2: Students & Subjects (layered)
      const positionedNodes = json.nodes.map((node: Node) => {
        let col = 1;
        if (node.type === "teacher") col = 0;
        else if (node.type === "class") col = 1;
        else col = 2; // student or subject

        return {
          ...node,
          col,
        };
      });

      // Distribute y coordinates within each column
      const colCounts = [0, 0, 0];
      positionedNodes.forEach((node: any) => {
        colCounts[node.col]++;
      });

      const colIndices = [0, 0, 0];
      const width = 800;
      const height = 450;

      const finalNodes = positionedNodes.map((node: any) => {
        const idx = colIndices[node.col]++;
        const total = colCounts[node.col];

        const x = 100 + node.col * 280;
        const y = total > 1
          ? 60 + (idx / (total - 1)) * (height - 120)
          : height / 2;

        return { ...node, x, y };
      });

      setNodes(finalNodes);
      setLinks(json.links);
    } catch (err: any) {
      setError(err.message || "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case "teacher": return "stroke-amber-500 fill-amber-500/10";
      case "class": return "stroke-indigo-500 fill-indigo-500/10";
      case "subject": return "stroke-teal-500 fill-teal-500/10";
      default: return "stroke-violet-500 fill-violet-500/10";
    }
  };

  const getConnectedLinks = (nodeId: string) => {
    return links.filter(l => l.source === nodeId || l.target === nodeId);
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600/20 to-indigo-500/10 border border-violet-500/20 rounded-3xl p-6 lg:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-violet-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 animate-pulse" />
                Interactive Map
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
                College Knowledge Graph
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Interactive relationship visualization between Teachers, Classes, Students, and Subjects.
              </p>
            </div>
            <button
              onClick={fetchGraph}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-xl text-violet-400 text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Reset Graph</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#151922] border border-rose-500/20 rounded-3xl p-8 text-center text-rose-400">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Graph view */}
            <div className="lg:col-span-3 bg-[#151922] border border-gray-800/80 rounded-3xl p-4 overflow-x-auto">
              <svg width="800" height="450" className="mx-auto block select-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
                  </marker>
                </defs>

                {/* Render Links */}
                {links.map((link, idx) => {
                  const sourceNode = nodes.find(n => n.id === link.source);
                  const targetNode = nodes.find(n => n.id === link.target);

                  if (!sourceNode || !targetNode) return null;

                  const isHighlighted =
                    selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target);

                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        className={`transition-all duration-300 ${
                          isHighlighted ? "stroke-violet-500 stroke-[2.5px]" : "stroke-gray-800 stroke-[1.5px]"
                        }`}
                        markerEnd="url(#arrow)"
                      />
                      {isHighlighted && (
                        <text
                          x={((sourceNode.x || 0) + (targetNode.x || 0)) / 2}
                          y={((sourceNode.y || 0) + (targetNode.y || 0)) / 2 - 5}
                          fill="#8b5cf6"
                          className="text-[9px] font-bold text-center select-none"
                          textAnchor="middle"
                        >
                          {link.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Render Nodes */}
                {nodes.map((node) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const isHovered = hoveredNode && hoveredNode.id === node.id;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected || isHovered ? 16 : 14}
                        className={`transition-all duration-300 stroke-[2px] ${getNodeColor(node.type)} ${
                          isSelected ? "stroke-[3px] stroke-violet-400 filter drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" : ""
                        }`}
                      />
                      <text
                        x={node.x}
                        y={(node.y || 0) + 30}
                        fill={isSelected ? "#c084fc" : "#9ca3af"}
                        className="text-[10px] font-semibold text-center select-none"
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar Inspector Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[#151922] border border-gray-800/80 rounded-3xl p-6 h-full flex flex-col">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-violet-400" />
                  Graph Inspector
                </h3>

                {selectedNode ? (
                  <div className="flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700/50">
                        {selectedNode.type}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-2 leading-snug">{selectedNode.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">ID: {selectedNode.id}</p>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Direct Connections</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {getConnectedLinks(selectedNode.id).map((link, i) => {
                          const otherNode = nodes.find(
                            n => n.id === (link.source === selectedNode.id ? link.target : link.source)
                          );
                          return (
                            <div key={i} className="p-3 bg-[#0d0f14]/50 border border-gray-800/80 rounded-xl text-xs">
                              <span className="text-gray-500 uppercase font-semibold text-[9px] tracking-wider block">
                                {link.label}
                              </span>
                              <span className="text-gray-300 font-medium block mt-0.5">{otherNode?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                    <HelpCircle className="h-10 w-10 text-gray-700 mb-2" />
                    <p className="text-xs text-gray-500 leading-normal">
                      Click any node on the graph map to inspect relations and details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Simple loader helper
function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
