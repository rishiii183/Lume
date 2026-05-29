import type { AttackGraphResult } from '@/types';
import { AttackPathCard } from '@/components/AttackPathCard';

export function AttackPropagationGraph({ graph }: { graph: AttackGraphResult | null }) {
  if (!graph) return null;
  const topPaths = graph.criticalPaths.slice(0, 3);
  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Attack propagation graph</h3>
          <p className="text-sm text-slate-400">Top multi-hop paths and privileged choke points.</p>
        </div>
        <div className="text-sm text-slate-300">Risk {Math.round(graph.propagationRisk)}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {topPaths.length > 0 ? topPaths.map((path) => <AttackPathCard key={`${path.sourceNode}-${path.targetNode}`} path={path} />) : <div className="text-sm text-slate-400">No propagated attack chains identified.</div>}
      </div>
    </section>
  );
}
