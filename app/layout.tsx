import type { Metadata } from 'next';
import Link from 'next/link';
import { Radar, Github } from 'lucide-react';
import './globals.css';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { RiskTranslationToggle } from '@/components/RiskTranslationToggle';

export const metadata: Metadata = {
  title: 'DebtRadar — AI Software Trust Intelligence',
  description: 'AI-powered software trust, risk, and deployment intelligence for technical and non-technical teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
