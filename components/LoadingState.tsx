'use client';

import { Radar, Loader2 } from 'lucide-react';
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
  // Determine statuses for each step
  const steps = [
    {
      id: 1,
      label: 'Repository Setup',
      description: 'Fetching file list and metadata from GitHub',
      isActive: progress > 0 && progress <= 15,
      isCompleted: progress > 15,
    },
    {
      id: 2,
      label: 'Abstract Syntax Tree',
      description: 'Parsing functions, classes, and import dependencies',
      isActive: progress > 15 && progress <= 45,
      isCompleted: progress > 45,
    },
    {
      id: 3,
      label: 'Complexity & Debt Scorer',
      description: 'Analyzing blast radius, code duplication, and technical debt',
      isActive: progress > 45 && progress <= 75,
      isCompleted: progress > 75,
    },
    {
      id: 4,
      label: 'AI & Security Analysis',
      description: 'Querying Hugging Face models and generating risk insights',
      isActive: progress > 75 && progress < 100,
      isCompleted: progress === 100,
    },
  ];

  return (
    <div className="glass-panel rounded-3xl p-8 max-w-2xl mx-auto border border-[rgba(176,123,79,0.12)] shadow-xl bg-white/50 backdrop-blur-md fade-in-up">
      {/* Visual scanning container */}
      <div className="flex justify-center mb-8 relative">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Sonar waves */}
          <div className="sonar-ring sonar-ring-1" />
          <div className="sonar-ring sonar-ring-2" />
          <div className="sonar-ring sonar-ring-3" />
          
          {/* Central radar icon */}
          <div className="relative z-10 w-16 h-16 bg-[#efe8de] rounded-full flex items-center justify-center shadow-md border border-[rgba(176,123,79,0.1)]">
            <Radar className="w-9 h-9 text-[#b07b4f] animate-pulse" />
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2 leading-tight">{title}</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto font-medium leading-relaxed">
          Please wait while our backend maps your repository structure and analyzes engineering debt.
        </p>
      </div>

      {/* Checklist steps */}
      <div className="space-y-4 mb-8 bg-[#f5efe7]/30 border border-[rgba(176,123,79,0.06)] rounded-2xl p-5">
        {steps.map((step) => {
          let statusIcon;
          let labelClass = 'text-slate-500 font-medium';
          let descClass = 'text-slate-400 font-medium';

          if (step.isCompleted) {
            statusIcon = (
              <div className="w-5 h-5 rounded-full bg-[#93ab68]/15 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-[#93ab68]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            );
            labelClass = 'text-slate-400 font-semibold line-through decoration-slate-300';
            descClass = 'text-slate-400/70 font-medium';
          } else if (step.isActive) {
            statusIcon = (
              <Loader2 className="w-5 h-5 text-[#b07b4f] animate-spin shrink-0" />
            );
            labelClass = 'text-[#b07b4f] font-bold';
            descClass = 'text-slate-600 font-medium';
          } else {
            statusIcon = (
              <div className="w-5 h-5 rounded-full border-[1.5px] border-slate-300 shrink-0 bg-white/50" />
            );
            labelClass = 'text-slate-400 font-medium';
            descClass = 'text-slate-400/50 font-medium';
          }

          return (
            <div key={step.id} className="flex gap-3.5 items-start">
              <div className="mt-0.5">{statusIcon}</div>
              <div className="flex-1 text-left">
                <p className={`text-sm ${labelClass} transition-colors duration-300`}>
                  {step.label}
                </p>
                <p className={`text-xs ${descClass} transition-colors duration-300 mt-0.5`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {progress > 0 && (
        <div className="w-full">
          <ProgressBar progress={progress} message={message} />
        </div>
      )}
    </div>
  );
}
