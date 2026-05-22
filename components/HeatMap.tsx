'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { DebtNode, GraphLink } from '@/types';
import { scoreColor } from '@/lib/utils';

interface HeatMapProps {
  nodes: DebtNode[];
  links: GraphLink[];
  selectedId: string | null;
  onSelect: (node: DebtNode | null) => void;
  width?: number;
  height?: number;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  debt_score: number;
  symbol_name: string;
  file_path: string;
  blast_radius: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export function HeatMap({
  nodes,
  links,
  selectedId,
  onSelect,
  width = 800,
  height = 600,
}: HeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const render = useCallback(() => {
    if (!containerRef.current || nodes.length === 0) return;

    const container = containerRef.current;
    const w = container.clientWidth || width;
    const h = container.clientHeight || height;

    d3.select(container).selectAll('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', [0, 0, w, h]);

    svgRef.current = svg.node();

    const g = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      debt_score: n.debt_score,
      symbol_name: n.symbol_name,
      file_path: n.file_path,
      blast_radius: n.blast_radius,
      x: n.x ?? undefined,
      y: n.y ?? undefined,
    }));

    const nodeIds = new Set(simNodes.map((n) => n.id));
    const simLinks = links
      .filter((l) => nodeIds.has(l.source as string) && nodeIds.has(l.target as string))
      .map((l) => ({
        source: l.source as string,
        target: l.target as string,
        weight: l.weight,
      }));

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        'link',
        d3
          .forceLink(simLinks)
          .id((d) => (d as SimNode).id)
          .distance(80)
          .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius((d) => radius(d as SimNode) + 4));

    const link = g
      .append('g')
      .attr('stroke', 'rgba(148, 163, 184, 0.2)')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke-width', (d) => Math.sqrt(d.weight) * 0.3 + 0.5);

    const dragBehavior = d3
      .drag<SVGCircleElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const node = g
      .append('g')
      .selectAll<SVGCircleElement, SimNode>('circle')
      .data(simNodes)
      .join('circle')
      .attr('r', (d) => radius(d))
      .attr('fill', (d) => scoreColor(d.debt_score))
      .attr('stroke', (d) => (d.id === selectedId ? '#fff' : 'rgba(255,255,255,0.15)'))
      .attr('stroke-width', (d) => (d.id === selectedId ? 3 : 1))
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const full = nodes.find((n) => n.id === d.id) ?? null;
        onSelect(full);
      });

    node.call(dragBehavior);

    const label = g
      .append('g')
      .selectAll('text')
      .data(simNodes.filter((d) => d.debt_score >= 60))
      .join('text')
      .text((d) => d.symbol_name)
      .attr('font-size', 9)
      .attr('fill', 'rgba(241, 245, 249, 0.7)')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -radius(d) - 4)
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => getLinkNode(d.source).x ?? 0)
        .attr('y1', (d) => getLinkNode(d.source).y ?? 0)
        .attr('x2', (d) => getLinkNode(d.target).x ?? 0)
        .attr('y2', (d) => getLinkNode(d.target).y ?? 0);

      node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
    });

    svg.on('click', () => onSelect(null));
  }, [nodes, links, selectedId, onSelect, width, height]);

  useEffect(() => {
    render();
    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="graph-container w-full h-full min-h-[400px] bg-navy-900/50 rounded-xl overflow-hidden"
    />
  );
}

function radius(d: SimNode): number {
  return Math.max(6, Math.min(24, 6 + d.blast_radius * 0.3 + d.debt_score * 0.08));
}

function getLinkNode(endpoint: SimNode | string): SimNode {
  if (typeof endpoint === 'string') {
    return { id: endpoint, debt_score: 0, symbol_name: '', file_path: '', blast_radius: 0 };
  }
  return endpoint;
}
