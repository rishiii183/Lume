import type { AttackPath } from '@/types';

export function AttackPathCard({ path }: { path: AttackPath }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{path.sourceNode}</div>
        <div className="text-xs text-slate-400">Risk {Math.round(path.propagationRisk)}</div>
      </div>
      <div className="text-xs text-slate-400 break-all">{path.path.join(' -> ')}</div>
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
        <span className="rounded-full bg-white/5 px-2 py-1">Complexity {path.attackComplexity}</span>
        <span className="rounded-full bg-white/5 px-2 py-1">Privilege {Math.round(path.privilegeEscalationPotential)}</span>
        <span className="rounded-full bg-white/5 px-2 py-1">Exploitability {Math.round(path.exploitabilityScore)}</span>
      </div>
    </div>
  );
}
