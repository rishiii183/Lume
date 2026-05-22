'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radar,
  Zap,
  GitBranch,
  Brain,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { URLInput } from '@/components/URLInput';

const FEATURES = [
  {
    icon: GitBranch,
    title: 'AST Analysis',
    desc: 'Parse JS/TS with acorn to map functions, classes, and call graphs.',
  },
  {
    icon: TrendingUp,
    title: 'Debt Scoring',
    desc: 'Weighted formula across complexity, duplication, blast radius, and coupling.',
  },
  {
    icon: Brain,
    title: 'AI Explanations',
    desc: 'Mistral-7B via Hugging Face explains why each symbol carries debt.',
  },
  {
    icon: Shield,
    title: 'Debt Fingerprint',
    desc: 'FLAN-T5 classifies code into agent-style debt categories.',
  },
  {
    icon: Zap,
    title: 'Blast Radius',
    desc: 'BFS dependency traversal capped at 200 nodes for actionable graphs.',
  },
  {
    icon: Radar,
    title: 'D3 Force Graph',
    desc: 'Interactive heat map with zoom, pan, and drag for exploration.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (repoUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      router.push(`/analyze/${data.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <section className="text-center mb-16">
        <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-1.5 text-sm text-accent-cyan mb-6">
          <Radar className="w-4 h-4" />
          Hackathon MVP — Production Ready
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Map Your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-emerald">
            Technical Debt
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Paste a GitHub repo URL. DebtRadar fetches code, runs AST analysis,
          scores debt hotspots, and visualizes blast radius — with AI explanations
          powered by Hugging Face.
        </p>
        <URLInput onSubmit={handleAnalyze} loading={loading} />
        {error && (
          <p className="mt-4 text-accent-rose text-sm">{error}</p>
        )}
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-panel rounded-xl p-5 hover:border-accent-cyan/20 transition-colors">
            <f.icon className="w-8 h-8 text-accent-cyan mb-3" />
            <h3 className="font-semibold text-slate-200 mb-1">{f.title}</h3>
            <p className="text-sm text-slate-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
