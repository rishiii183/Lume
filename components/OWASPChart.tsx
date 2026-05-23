'use client';

import type { SecurityFinding, SecuritySummary } from '@/types';

interface OWASPChartProps {
  summary: SecuritySummary | null | undefined;
  findings: SecurityFinding[];
}

export function OWASPChart({ summary, findings }: OWASPChartProps) {
  const categoryEntries = Object.entries(summary?.categoryCounts ?? {}).sort((a, b) => b[1] - a[1]);
  const severity = [
    { label: 'Critical', value: summary?.critical ?? 0, color: '#8f1d1d' },
    { label: 'High', value: summary?.high ?? 0, color: '#d85b2b' },
    { label: 'Medium', value: summary?.medium ?? 0, color: '#f0c04e' },
    { label: 'Low', value: summary?.low ?? 0, color: '#4d84c4' },
  ];

  return (
    <div className="glass-panel rounded-3xl p-5 border border-[rgba(176,123,79,0.12)] shadow-md bg-white/40 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-slate-800">OWASP Coverage</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">{findings.length} findings mapped to security categories</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Security Score</p>
          <p className="text-2xl font-extrabold text-slate-900">{summary?.score ?? 0}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {severity.map((item) => (
            <Bar key={item.label} label={item.label} value={item.value} color={item.color} total={Math.max(1, summary?.totalVulnerabilities ?? 1)} />
          ))}
        </div>
        <div className="space-y-3">
          {categoryEntries.slice(0, 6).map(([label, value]) => (
            <Bar key={label} label={label} value={value} color="#b07b4f" total={Math.max(1, summary?.totalVulnerabilities ?? 1)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const width = `${Math.max(5, Math.min(100, (value / total) * 100))}%`;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
      </div>
    </div>
  );
}
