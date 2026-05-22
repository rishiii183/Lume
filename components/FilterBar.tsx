'use client';

import { Search, Filter } from 'lucide-react';
import type { FilterState, DebtNode } from '@/types';

interface FilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  nodeCount: number;
}

const NODE_TYPES: DebtNode['node_type'][] = [
  'function',
  'class',
  'module',
  'variable',
];

export function FilterBar({ filter, onChange, nodeCount }: FilterBarProps) {
  return (
    <div className="glass-panel rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-slate-300">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        <span className="text-xs text-slate-500 ml-auto">{nodeCount} nodes</span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          placeholder="Search symbols..."
          className="w-full bg-navy-800/50 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-accent-cyan/30"
        />
      </div>

      <div>
        <label className="text-xs text-slate-500 mb-2 block">
          Min score: {filter.minScore}
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filter.minScore}
          onChange={(e) =>
            onChange({ ...filter, minScore: Number(e.target.value) })
          }
          className="w-full accent-accent-cyan"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {NODE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              const types = filter.nodeTypes.includes(type)
                ? filter.nodeTypes.filter((t) => t !== type)
                : [...filter.nodeTypes, type];
              onChange({ ...filter, nodeTypes: types });
            }}
            className={`text-xs px-2 py-1 rounded-md capitalize transition-colors ${
              filter.nodeTypes.includes(type)
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'bg-navy-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
