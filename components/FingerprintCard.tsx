'use client';

import { Fingerprint, Tag } from 'lucide-react';

interface FingerprintCardProps {
  label: string | null;
  confidence?: number | null;
  className?: string;
}

const LABEL_COLORS: Record<string, string> = {
  'legacy-spaghetti': 'text-accent-rose',
  'god-object': 'text-accent-amber',
  'callback-hell': 'text-accent-rose',
  'copy-paste-clone': 'text-accent-amber',
  'dead-code': 'text-slate-400',
  'over-engineered': 'text-accent-cyan',
  'tight-coupling': 'text-accent-rose',
  'missing-abstraction': 'text-accent-emerald',
};

export function FingerprintCard({
  label,
  confidence,
  className = '',
}: FingerprintCardProps) {
  if (!label) return null;

  const colorClass = LABEL_COLORS[label] ?? 'text-accent-cyan';

  return (
    <div className={`glass-panel rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Fingerprint className="w-4 h-4 text-accent-cyan" />
        <span className="text-sm font-medium text-slate-300">Debt Fingerprint</span>
      </div>
      <div className="flex items-center gap-2">
        <Tag className={`w-4 h-4 ${colorClass}`} />
        <span className={`font-mono text-sm capitalize ${colorClass}`}>
          {label.replace(/-/g, ' ')}
        </span>
      </div>
      {confidence != null && (
        <p className="text-xs text-slate-500 mt-2">
          Confidence: {(confidence * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}
