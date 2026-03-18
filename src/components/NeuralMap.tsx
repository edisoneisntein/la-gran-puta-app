import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useAppStore } from '../store';

type Node = {
  id: string;
  group: number;
  label: string;
};

export const NeuralMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { mapNodes, resetMap } = useAppStore();

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 500;

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    svg.selectAll("*").remove();

    // Generate links based on nodes (connecting everything to CORE for now)
    const links = mapNodes
      .filter(n => n.id !== "CORE")
      .map(n => ({ source: "CORE", target: n.id, value: 1 }));

    const simulation = d3.forceSimulation(mapNodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#ef4444")
      .attr("stroke-opacity", 0.2)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = svg.append("g")
      .selectAll("g")
      .data(mapNodes)
      .join("g")
      .call(drag(simulation) as any);

    node.append("circle")
      .attr("r", d => d.id === "CORE" ? 12 : 6)
      .attr("fill", d => {
        if (d.id === "CORE") return "#ef4444";
        if (d.group === 2) return "#3b82f6";
        if (d.group === 3) return "#f59e0b";
        if (d.group === 4) return "#a855f7";
        return "#3b82f6";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("filter", d => `drop-shadow(0 0 8px ${d.id === "CORE" ? "rgba(239, 68, 68, 0.5)" : "rgba(255,255,255,0.2)"})`)
      .attr("class", d => d.group >= 3 ? "pulse-node" : "");

    node.append("text")
      .text(d => d.label)
      .attr("x", 14)
      .attr("y", 4)
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("pointer-events", "none")
      .attr("class", "select-none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => simulation.stop();
  }, [mapNodes]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-2xl">
      <div className="absolute top-4 left-4 z-10">
        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Neural Map // Prompt History</span>
        <div className="text-[9px] text-slate-500 font-sans mt-1">NODES_ACTIVE: {mapNodes.length}</div>
      </div>
      <button 
        onClick={resetMap}
        className="absolute top-4 right-4 z-10 text-[9px] text-red-500/50 hover:text-red-500 font-sans border border-red-500/20 px-2 py-1 transition-colors rounded"
      >
        RESET_MAP
      </button>
      <svg ref={svgRef} className="w-full h-[500px] cursor-move" />
      <div className="absolute bottom-4 right-4 text-[9px] text-slate-500 font-sans flex flex-col items-end">
        <span>DRAG NODES TO REORGANIZE</span>
        <span className="text-blue-500/50 uppercase">System Stable</span>
      </div>
    </div>
  );
};
