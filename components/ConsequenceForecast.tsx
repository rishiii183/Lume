import type { ConsequencePredictionResult } from '@/types';

export function ConsequenceForecast({ forecast }: { forecast: ConsequencePredictionResult | null }) {
  if (!forecast) return null;

  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">What happens if ignored</h3>
        <p className="text-sm text-slate-400">Likely consequences when the issue is left unresolved.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-300">
        <Block title="Short term" value={forecast.shortTermImpact} />
        <Block title="Long term" value={forecast.longTermImpact} />
        <Block title="Production risk" value={forecast.productionRisk} />
        <Block title="Customer risk" value={forecast.customerRisk} />
        <Block title="Scalability impact" value={forecast.scalabilityImpact} />
        <Block title="Severity" value={forecast.estimatedSeverity} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {forecast.likelyFailureScenarios.map((scenario) => (
          <span key={scenario} className="rounded-full bg-white/5 px-3 py-1">{scenario}</span>
        ))}
      </div>
    </section>
  );
}

function Block({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className="mt-1 text-slate-100">{value}</div>
    </div>
  );
}
