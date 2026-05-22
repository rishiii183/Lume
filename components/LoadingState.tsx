'use client';

import { Loader2, Radar } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface LoadingStateProps {
  progress?: number;
  message?: string | null;
  title?: string;
}

export function LoadingState({
  progress = 0,
  message,
  title = 'Analyzing repository',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8">
      <div className="relative">
        <Radar className="w-16 h-16 text-accent-cyan animate-pulse" />
        <Loader2 className="w-8 h-8 text-accent-amber absolute -bottom-1 -right-1 animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">{title}</h2>
        <p className="text-slate-400 text-sm max-w-md">
          Scanning AST, computing debt scores, and building dependency graph...
        </p>
      </div>
      {progress > 0 && (
        <div className="w-full max-w-md">
          <ProgressBar progress={progress} message={message} />
        </div>
      )}
    </div>
  );
}
