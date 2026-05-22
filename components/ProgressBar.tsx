'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  message?: string | null;
  className?: string;
}

export function ProgressBar({ progress, message, className }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-slate-400 mb-2">
        <span>{message ?? 'Processing...'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-emerald transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
