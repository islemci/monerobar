"use client";

import React from "react";
import type { PoolsApiResponse } from "@/types/pools";

type PoolsListProps = {
  data?: PoolsApiResponse;
};

function formatHashrate(hash: number): string {
  if (hash >= 1_000_000_000) return `${(hash / 1_000_000_000).toFixed(2)} GH/s`;
  if (hash >= 1_000_000) return `${(hash / 1_000_000).toFixed(2)} MH/s`;
  if (hash >= 1_000) return `${(hash / 1_000).toFixed(2)} KH/s`;
  return `${hash} H/s`;
}

export function PoolsList({ data }: PoolsListProps) {
  const pools = data?.pools ?? [];
  if (pools.length === 0) {
    return <div className="text-zinc-400 text-xs sm:text-sm">No pool data available</div>;
  }

  // Sort by hashrate descending
  const sorted = [...pools].sort((a, b) => b.hashrate - a.hashrate);
  const totalHash = data?.network?.hashrate ?? pools.reduce((s, p) => s + p.hashrate, 0);

  return (
    <div className="border border-white/10 rounded-none p-3 sm:p-4 bg-black/40">
      <div className="mb-2 text-xs uppercase tracking-widest text-zinc-400">POOLS</div>
      <div className="flex flex-col space-y-2">
        {sorted.map((p) => {
          const pct = totalHash > 0 ? (p.hashrate / totalHash) * 100 : 0;
          const width = Math.max(2, Math.min(100, Math.round(pct)));
          return (
            <div key={p.name} className="flex items-center gap-2 text-xs sm:text-sm" aria-label={`Pool ${p.name}`}>
              {p.homeUrl ? (
                <a href={p.homeUrl} target="_blank" rel="noopener noreferrer" className="truncate w-40 text-white hover:underline" title={p.name}>
                  {p.name}
                </a>
              ) : (
                <span className="truncate w-40 text-white" title={p.name}>{p.name}</span>
              )}
              <div className="flex-1 h-4 bg-white/10" aria-label={`Hashrate bar for ${p.name}`}>
                <div className="h-4 bg-white" style={{ width: `${width}%` }} title={`${p.hashrate.toLocaleString()} H/s`} />
              </div>
              <span className="w-28 text-right text-zinc-300" aria-label="Hashrate value">{formatHashrate(p.hashrate)}</span>
              <span className="w-14 text-right text-zinc-400" aria-label="Percent of total">{pct > 0 ? pct.toFixed(1) : '0.0'}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
