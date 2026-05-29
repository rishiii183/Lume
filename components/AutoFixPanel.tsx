import type { AutoFixResult } from '@/types';

export function AutoFixPanel({ result }: { result: AutoFixResult | null }) {
  if (!result) return null;
  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Autofix proposal</h3>
          <p className="text-sm text-slate-400">Model-backed repair candidate for the selected vulnerability.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-100">{Math.round(result.confidence * 100)}%</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk reduction {Math.round(result.estimatedRiskReduction)}</div>
        </div>
      </div>
      <div className="text-sm text-slate-300">{result.summary}</div>
      <div className="grid gap-3 md:grid-cols-2">
        <pre className="overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-300"><code>{result.beforeCode}</code></pre>
        <pre className="overflow-auto rounded-2xl bg-emerald-500/10 p-4 text-xs text-emerald-100"><code>{result.afterCode}</code></pre>
      </div>
    </section>
  );
}
