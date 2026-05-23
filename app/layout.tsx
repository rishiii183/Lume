import type { Metadata } from 'next';
import Link from 'next/link';
import { Radar, Github, LogIn } from 'lucide-react';
import './globals.css';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import { RiskTranslationToggle } from '@/components/RiskTranslationToggle';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DebtRadar ',
  description: 'AI-powered software trust, risk, and deployment intelligence for technical and non-technical teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen gradient-mesh`}>
        <ViewModeProvider>
          <header className="border-b border-[rgba(176,123,79,0.08)] bg-gradient-to-b from-[#fffaf5]/80 to-[#f5efe7]/70 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
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
                <Link
                  href="/auth"
                  className="flex items-center gap-2 text-sm px-5 py-2 bg-gradient-to-r from-[#b07b4f] to-[#8c6239] hover:opacity-90 text-white rounded-xl shadow-[0_4px_12px_rgba(176,123,79,0.15)] hover:shadow-[0_6px_16px_rgba(176,123,79,0.25)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline font-semibold">Sign in</span>
                </Link>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="border-t border-white/5 mt-auto py-8 text-center text-sm text-slate-500">
            <p>DebtRadar Powered by Hugging Face, Supabase & D3</p>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  );
}
