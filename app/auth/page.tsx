'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Radar, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/');
      setChecking(false);
    });
  }, [router]);

  const signInWithGitHub = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="glass-panel rounded-2xl p-8 text-center">
        <Radar className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign in to DebtRadar</h1>
        <p className="text-slate-400 text-sm mb-8">
          Connect your GitHub account via Supabase OAuth to save analyses and
          access private repositories.
        </p>
        <button
          type="button"
          onClick={signInWithGitHub}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 text-slate-100 py-3 px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Github className="w-5 h-5" />
          )}
          Continue with GitHub
        </button>
        <p className="text-xs text-slate-500 mt-6">
          Configure GitHub provider in Supabase Dashboard → Authentication → Providers
        </p>
      </div>
    </div>
  );
}
