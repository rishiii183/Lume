'use client';

import { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  // Reset explanation and error state when selected node changes (Requirement 18 / cleanup)
  useEffect(() => {
    setExplanation(null);
    setError(null);
    setExplaining(false);
  }, [node?.id]);

  if (!node) {
    return (
      <div className="glass-panel rounded-3xl p-6 h-full flex items-center justify-center border border-[rgba(176,123,79,0.12)] bg-white/40 shadow-md">
        <p className="text-slate-500 text-sm text-center font-medium leading-relaxed">
          Select a node on the graph to view debt details
        </p>
      </div>
    );
  }

  const handleExplain = async () => {
    setExplaining(true);
    setExplanation(null);
    setError(null);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.id,
          analysisId,
          node,
          codeSnippet: `// ${node.symbol_name} in ${node.file_path}\n// Lines ${node.line_start}-${node.line_end}`,
          filePath: node.file_path,
          debtScore: node.debt_score,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to generate explanation.');
      }

      if (data.explanation) {
        setExplanation(data.explanation);
      }
    } catch (err) {
      console.error("[Sidebar Error] AI Explain failed:", err);
      const errMsg = err instanceof Error ? err.message : 'AI explanation unavailable temporarily.';
      setError(errMsg);
      alert(`Error generating explanation: ${errMsg}`); // Toast notification
    } finally {
      setExplaining(false);
    }
  };

  const displayExplanation = explanation ?? node.explanation;

  return (
    <div className="glass-panel rounded-3xl p-5 h-full overflow-y-auto scrollbar-thin space-y-5 border border-[rgba(176,123,79,0.12)] shadow-md bg-white/40">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800 lg:hidden font-bold transition-colors"
        >
          ✕ Close
        </button>
      )}

      <div>
        <h3 className="font-extrabold text-xl text-slate-800 tracking-tight leading-tight">{node.symbol_name}</h3>
        <p className="text-xs text-slate-500 font-mono font-medium mt-1.5 break-all bg-[#f5efe7]/40 px-2 py-1 rounded border border-[rgba(176,123,79,0.08)]">
          {truncate(node.file_path, 60)}
        </p>
      </div>

      <div>
        <span className="text-xs text-slate-500 font-bold block mb-1.5">Technical Debt Score</span>
        <div
          className="text-4xl font-extrabold tracking-tight flex items-baseline"
          style={{ color: scoreColor(node.debt_score) }}
        >
          {formatScore(node.debt_score)}
          <span className="text-sm text-slate-400 font-bold ml-1">/ 100</span>
        </div>
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

      <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
        <span>Code scope:</span>
        <span className="font-mono text-slate-600">Lines {node.line_start}–{node.line_end}</span>
      </div>

      {node.fingerprint_tag && (
        <div className="text-xs bg-[#b07b4f]/10 border border-[#b07b4f]/20 rounded-xl px-3 py-2.5 text-[#b07b4f] font-bold font-mono tracking-wide text-center capitalize shadow-sm">
          {node.fingerprint_tag.replace(/-/g, ' ')}
        </div>
      )}

      <button
        type="button"
        onClick={handleExplain}
        disabled={explaining}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#b07b4f] to-[#8c6239] hover:from-[#8c6239] hover:to-[#5f5348] text-white py-3.5 rounded-xl font-bold transition-all shadow-[0_4px_12px_rgba(176,123,79,0.15)] hover:shadow-[0_6px_16px_rgba(176,123,79,0.25)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {explaining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span>AI Explain (Mistral)</span>
      </button>

      {error && (
        <div className="bg-[#c44d4d]/10 border border-[#c44d4d]/20 rounded-xl p-4 text-sm text-[#c44d4d] shadow-sm">
          <p className="font-bold mb-1">AI Explanation Failed</p>
          <p className="text-xs text-[#c44d4d]/85 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {displayExplanation && (
        <div className="bg-gradient-to-br from-[#fffaf5] to-[#f5efe7]/60 border border-[rgba(176,123,79,0.15)] rounded-2xl p-5 text-sm text-slate-700 leading-relaxed shadow-sm font-medium relative overflow-hidden">
          <div className="flex items-center gap-1.5 text-[#b07b4f] font-bold text-xs mb-2.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Architectural Insights</span>
          </div>
          <p className="leading-relaxed">{displayExplanation}</p>
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
    <div className="bg-[#f5efe7]/40 border border-[rgba(176,123,79,0.08)] rounded-2xl p-3 shadow-sm hover:bg-[#efe8de]/50 transition-colors">
      <Icon className="w-4 h-4 text-[#b07b4f] mb-1.5" />
      <p className="text-xs text-slate-400 font-bold">{label}</p>
      <p className="text-sm font-extrabold text-slate-800 capitalize mt-0.5">{value}</p>
    </div>
  );
}
