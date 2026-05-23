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
    <div className="glass-panel rounded-3xl p-5 space-y-5 border border-[rgba(176,123,79,0.12)] shadow-md bg-white/40">
      <div className="flex items-center gap-2 text-slate-800">
        <Filter className="w-4 h-4 text-[#b07b4f]" />
        <span className="text-sm font-bold">Filters</span>
        <span className="text-xs text-slate-400 ml-auto font-semibold">{nodeCount} nodes</span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          placeholder="Search symbols..."
          className="w-full bg-[#f5efe7]/40 border border-[rgba(176,123,79,0.15)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#b07b4f]/40 transition-colors font-medium"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-600 font-bold block">
          Min score: <span className="text-[#b07b4f] font-mono">{filter.minScore}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={filter.minScore}
          onChange={(e) =>
            onChange({ ...filter, minScore: Number(e.target.value) })
          }
          className="w-full accent-[#b07b4f] cursor-pointer"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {NODE_TYPES.map((type) => {
          const isActive = filter.nodeTypes.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                const types = filter.nodeTypes.includes(type)
                  ? filter.nodeTypes.filter((t) => t !== type)
                  : [...filter.nodeTypes, type];
                onChange({ ...filter, nodeTypes: types });
              }}
              className={`text-xs px-3 py-1.5 rounded-xl capitalize font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#b07b4f] to-[#8c6239] text-white shadow-sm hover:opacity-95'
                  : 'bg-[#efe8de]/70 text-slate-600 hover:text-slate-800 hover:bg-[#e5d9c8]/70 border border-transparent'
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
