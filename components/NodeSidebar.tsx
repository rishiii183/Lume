'use client';

import { useState } from 'react';
import {
  FileCode,
  AlertTriangle,
  Network,
  Copy,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { DebtNode } from '@/types';
import { formatScore, scoreColor, truncate } from '@/lib/utils';

interface NodeSidebarProps {
  node: DebtNode | null;
  analysisId: string;
  onClose?: () => void;
}

export function NodeSidebar({ node, analysisId, onClose }: NodeSidebarProps) {
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  if (!node) {
    return (
      <div className="glass-panel rounded-xl p-6 h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm text-center">
          Select a node on the graph to view debt details
        </p>
      </div>
    );
  }

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id, analysisId }),
      });
      const data = await res.json();
      if (data.explanation) setExplanation(data.explanation);
    } catch {
      setExplanation('Failed to generate explanation. Check HuggingFace API key.');
    } finally {
      setExplaining(false);
    }
  };

  const displayExplanation = explanation ?? node.explanation;

  return (
    <div className="glass-panel rounded-xl p-5 h-full overflow-y-auto scrollbar-thin space-y-4">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-300 lg:hidden"
        >
          Close
        </button>
      )}

      <div>
        <h3 className="font-semibold text-lg text-slate-100">{node.symbol_name}</h3>
        <p className="text-xs text-slate-500 font-mono mt-1">{truncate(node.file_path, 40)}</p>
      </div>

      <div
        className="text-3xl font-bold"
        style={{ color: scoreColor(node.debt_score) }}
      >
        {formatScore(node.debt_score)}
        <span className="text-sm text-slate-500 font-normal ml-1">/ 100</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={AlertTriangle} label="Complexity" value={node.complexity} />
        <Metric icon={Network} label="Blast Radius" value={node.blast_radius} />
        <Metric
          icon={Copy}
          label="Duplication"
          value={`${(node.duplication_score * 100).toFixed(0)}%`}
        />
        <Metric icon={FileCode} label="Type" value={node.node_type} />
      </div>

      <div className="text-xs text-slate-500">
        Lines {node.line_start}–{node.line_end}
      </div>

      {node.fingerprint_tag && (
        <div className="text-xs bg-navy-700 rounded-lg px-3 py-2 text-accent-cyan font-mono">
          {node.fingerprint_tag}
        </div>
      )}

      <button
        type="button"
        onClick={handleExplain}
        disabled={explaining}
        className="w-full flex items-center justify-center gap-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {explaining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        AI Explain (Mistral)
      </button>

      {displayExplanation && (
        <div className="bg-navy-800/50 rounded-lg p-3 text-sm text-slate-300 leading-relaxed">
          {displayExplanation}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-navy-800/40 rounded-lg p-3">
      <Icon className="w-3.5 h-3.5 text-slate-500 mb-1" />
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
