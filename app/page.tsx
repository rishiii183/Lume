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
    title: 'Software Trust Analysis',
    desc: 'Map code structure, risk hot spots, and shipping confidence across the repository.',
  },
  {
    icon: TrendingUp,
    title: 'Deployment Confidence',
    desc: 'Estimate whether the system is safe to ship, needs review, or should pause release.',
  },
  {
    icon: Brain,
    title: 'Executive Translation',
    desc: 'Convert technical findings into customer, operational, and business impact.',
  },
  {
    icon: Shield,
    title: 'Trust Score',
    desc: 'Summarize repository health, security exposure, and production readiness.',
  },
  {
    icon: Zap,
    title: 'If Ignored Forecast',
    desc: 'Show what happens if risk is not addressed: outages, exposure, or slower delivery.',
  },
  {
    icon: Radar,
    title: 'Risk Graph',
    desc: 'Interactive map that works for engineers, founders, and decision makers.',
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
    <div className="fade-in-up">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4">
        <section className="text-center mb-6">
          <div className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[rgba(176,123,79,0.15)] bg-[#efe8de] px-4 py-2 text-xs font-semibold leading-snug text-[#b07b4f] shadow-sm sm:px-5 sm:text-sm mb-6">
            <Radar className="h-4 w-4 flex-shrink-0" />
            <span>AI Software Trust Intelligence Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-tight">
            Can This Software Be Trusted{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b07b4f] to-[#8c6239]">
              And Safely Shipped
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Paste a GitHub repo URL. DebtRadar now translates technical and security findings into
            trust, deployment, customer, and operational impact for both engineers and business stakeholders.
          </p>
          <div className="flex justify-center">
            <URLInput onSubmit={handleAnalyze} loading={loading} />
          </div>
          {error && (
            <p className="mt-4 text-accent-rose text-sm font-semibold">{error}</p>
          )}
        </section>
      </div>

      <section 
        className="relative overflow-hidden w-full py-8"
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}
      >
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-6 px-3">
          {/* Duplicate the array to create a seamless infinite loop */}
          {[...FEATURES, ...FEATURES].map((f, i) => (
            <div key={`${f.title}-${i}`} className="w-[320px] shrink-0 glass-panel rounded-3xl p-6 hover-lift bg-gradient-to-br from-[#fffaf5] to-[#f5efe7]/50 border border-[rgba(176,123,79,0.08)]">
              <div className="inline-flex p-3 bg-[#f5efe7] rounded-2xl mb-4 text-[#b07b4f]">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
