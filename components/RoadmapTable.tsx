'use client';

import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import type { RoadmapItem } from '@/types';
import { formatScore, scoreColor } from '@/lib/utils';
import { SecurityBadge } from '@/components/SecurityBadge';

interface RoadmapTableProps {
  items: RoadmapItem[];
  analysisId: string;
}

export function RoadmapTable({ items, analysisId }: RoadmapTableProps) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-[rgba(176,123,79,0.12)] shadow-md bg-white/40">
      <div className="flex items-center justify-between p-5 border-b border-[rgba(176,123,79,0.08)]">
        <h2 className="font-extrabold text-slate-800">Refactoring Roadmap Priorities</h2>
        <a
          href={`/api/export/${analysisId}`}
          download
          className="flex items-center gap-2 text-sm text-[#b07b4f] hover:text-[#8c6239] font-bold transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-[rgba(176,123,79,0.08)] bg-[#f5efe7]/30">
              <th className="px-5 py-3.5 font-bold">#</th>
              <th className="px-5 py-3.5 font-bold">Symbol</th>
              <th className="px-5 py-3.5 font-bold">File</th>
              <th className="px-5 py-3.5 font-bold">Debt</th>
              <th className="px-5 py-3.5 font-bold">Security</th>
              <th className="px-5 py-3.5 font-bold">Critical Vulns</th>
              <th className="px-5 py-3.5 font-bold">OWASP</th>
              <th className="px-5 py-3.5 font-bold">Blast</th>
              <th className="px-5 py-3.5 font-bold">Security Priority</th>
              <th className="px-5 py-3.5 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.nodeId}
                className={`border-b border-[rgba(176,123,79,0.06)] hover:bg-[#f5efe7]/40 transition-colors ${item.criticalSecurity ? 'bg-[#fff4f4]/70' : ''}`}
              >
                <td className="px-5 py-3.5 text-slate-400 font-bold">{item.rank}</td>
                <td className="px-5 py-3.5 font-mono text-slate-800 font-bold">{item.symbolName}</td>
                <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate font-medium">
                  {item.filePath}
                </td>
                <td className="px-5 py-3.5 font-extrabold font-mono" style={{ color: scoreColor(item.debtScore) }}>
                  {formatScore(item.debtScore)}
                </td>
                <td className="px-5 py-3.5 text-slate-600 font-bold font-mono">
                  <SecurityBadge severity={item.criticalSecurity ? 'critical' : item.securityScore >= 75 ? 'high' : item.securityScore >= 50 ? 'medium' : 'low'} label={formatScore(item.securityScore)} />
                </td>
                <td className="px-5 py-3.5 text-slate-600 font-bold font-mono">{item.vulnerabilityCount}</td>
                <td className="px-5 py-3.5 text-slate-600 font-bold text-xs max-w-[220px] truncate">
                  {item.owaspCategories.join(', ') || '—'}
                </td>
                <td className="px-5 py-3.5 text-slate-600 font-bold font-mono">{item.blastRadius}</td>
                <td className="px-5 py-3.5 text-[#8f1d1d] font-extrabold font-mono">
                  {formatScore(item.securityPriority)}
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/analyze/${analysisId}?node=${item.nodeId}`}
                    className="text-[#b07b4f] hover:text-[#8c6239] transition-colors inline-block hover:scale-110"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="text-center text-slate-500 py-12 font-medium">No roadmap items yet.</p>
        )}
      </div>
    </div>
  );
}
