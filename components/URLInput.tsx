'use client';

import { useState } from 'react';
import { Github, Search, Loader2 } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string) => void;
  loading?: boolean;
}

export function URLInput({ onSubmit, loading }: URLInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="glass-panel rounded-2xl p-2 flex items-center gap-2">
        <Github className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo or owner/repo"
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 py-3 px-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Analyze
        </button>
      </div>
    </form>
  );
}
