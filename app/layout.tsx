import type { Metadata } from 'next';
import Link from 'next/link';
import { Radar, Github } from 'lucide-react';
import './globals.css';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { RiskTranslationToggle } from '@/components/RiskTranslationToggle';

import { createServerSupabase } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'DebtRadar — AI Software Trust Intelligence',
  description: 'AI-powered software trust, risk, and deployment intelligence for technical and non-technical teams',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    const supabase = await createServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user || null;
  } catch (err) {
    console.warn('[Layout] Failed to retrieve session:', err);
  }

  return (
    <html lang="en">
      <body className="min-h-screen gradient-mesh">
        <ViewModeProvider>
          <header className="border-b border-[rgba(176,123,79,0.08)] bg-gradient-to-b from-[#fffaf5]/80 to-[#f5efe7]/70 backdrop-blur-md sticky top-0 z-50">
            <div className="w-full px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
                <Radar className="w-7 h-7 text-accent-cyan group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Debt<span className="text-accent-cyan font-extrabold">Radar</span>
                </span>
              </Link>
              <div className="flex items-center gap-3 sm:gap-4">
                <RiskTranslationToggle />
                
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-semibold hidden md:inline max-w-[150px] truncate">
                      {user.email}
                    </span>
                    <form action="/auth/signout" method="POST" className="m-0">
                      <button
                        type="submit"
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition-all border border-rose-200/50"
                      >
                        Sign Out
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                )}

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-white/5 mt-auto py-8 text-center text-sm text-slate-500">
            <p>DebtRadar — Powered by Hugging Face, Supabase & D3</p>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  );
}
