'use client';

import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import type { RoadmapItem } from '@/types';
import { formatScore, scoreColor } from '@/lib/utils';

interface RoadmapTableProps {
  items: RoadmapItem[];
  analysisId: string;
}

export function RoadmapTable({ items, analysisId }: RoadmapTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h2 className="font-semibold text-slate-200">Refactoring Roadmap</h2>
        <a
          href={`/api/export/${analysisId}`}
          download
          className="flex items-center gap-2 text-sm text-accent-cyan hover:text-accent-cyan/80 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-white/5">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Debt</th>
              <th className="px-4 py-3 font-medium">Blast</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.nodeId}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-slate-500">{item.rank}</td>
                <td className="px-4 py-3 font-mono text-slate-200">{item.symbolName}</td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                  {item.filePath}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: scoreColor(item.debtScore) }}>
                  {formatScore(item.debtScore)}
                </td>
                <td className="px-4 py-3 text-slate-300">{item.blastRadius}</td>
                <td className="px-4 py-3 text-accent-amber font-medium">
                  {formatScore(item.priority)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/analyze/${analysisId}?node=${item.nodeId}`}
                    className="text-accent-cyan hover:text-accent-cyan/80"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center text-slate-500 py-12">No roadmap items yet.</p>
        )}
      </div>
    </div>
  );
}
