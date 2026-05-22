import type { Metadata } from 'next';
import Link from 'next/link';
import { Radar, Github, LogIn } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'DebtRadar — Technical Debt Intelligence',
  description: 'AI-powered technical debt analysis for GitHub repositories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-mesh">
        <header className="border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Radar className="w-7 h-7 text-accent-cyan group-hover:animate-pulse" />
              <span className="font-bold text-lg tracking-tight">
                Debt<span className="text-accent-cyan">Radar</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
              >
                <Github className="w-5 h-5" />
              </a>
              <Link
                href="/auth"
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-accent-cyan transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-white/5 mt-auto py-8 text-center text-sm text-slate-500">
          <p>DebtRadar — Powered by Hugging Face, Supabase & D3</p>
        </footer>
      </body>
    </html>
  );
}
