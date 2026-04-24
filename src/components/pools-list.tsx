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
    return (
      <div className="border border-white/10 rounded-none p-3 sm:p-4">
        <p className="text-zinc-400 text-xs sm:text-sm">No pool data available</p>
      </div>
    );
  }

  // Sort by hashrate descending
  const sorted = [...pools].sort((a, b) => b.hashrate - a.hashrate);
  const totalHash = data?.network?.hashrate ?? pools.reduce((s, p) => s + p.hashrate, 0);

  return (
    <div className="border border-white/10 rounded-none p-2 sm:p-4 font-mono text-xs sm:text-sm tracking-tighter">
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <p className="uppercase tracking-widest text-zinc-400 text-xs sm:text-sm">POOLS</p>
      </div>

      {/* Column Headers */}
      <div className="mb-2 hidden sm:grid sm:grid-cols-[1fr_2fr_16ch_12ch] gap-2 px-2">
        <p className="uppercase tracking-widest text-zinc-500 text-xs">Name</p>
        <p className="uppercase tracking-widest text-zinc-500 text-xs">Distribution</p>
        <p className="uppercase tracking-widest text-zinc-500 text-xs text-right">Hashrate</p>
        <p className="uppercase tracking-widest text-zinc-500 text-xs text-right">Share</p>
      </div>

      {/* Pool Rows */}
      <div className="space-y-2">
        {sorted.map((p) => {
          const pct = totalHash > 0 ? (p.hashrate / totalHash) * 100 : 0;
          const width = Math.max(2, Math.min(100, Math.round(pct)));
          return (
            <div
              key={p.name}
              className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_16ch_12ch] gap-1 sm:gap-2 border border-white/5 rounded-none p-2 bg-black/20 hover:bg-black/30 transition-colors"
              aria-label={`Pool ${p.name}`}
            >
              {/* Pool Name */}
              <div className="flex items-center min-h-6">
                {p.homeUrl ? (
                  <a
                    href={p.homeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-white hover:text-accent-monero transition-colors"
                    title={p.name}
                  >
                    {p.name}
                  </a>
                ) : (
                  <span className="truncate text-white" title={p.name}>
                    {p.name}
                  </span>
                )}
              </div>

              {/* Distribution Bar - Hidden on Mobile */}
              <div className="hidden sm:flex items-center">
                <div
                  className="h-4 bg-white/20 border border-white/10 flex-1"
                  aria-label={`Distribution bar for ${p.name}`}
                >
                  <div
                    className="h-4 bg-accent-monero"
                    style={{ width: `${width}%` }}
                    title={`${pct.toFixed(1)}% of network hashrate`}
                  />
                </div>
              </div>

              {/* Mobile Row 2: Hashrate and Share */}
              <div className="sm:hidden flex items-center justify-between gap-2 col-span-1">
                <span className="text-zinc-400">Rate:</span>
                <span className="text-white" aria-label="Hashrate value">
                  {formatHashrate(p.hashrate)}
                </span>
              </div>

              {/* Hashrate - Desktop */}
              <div className="hidden sm:flex items-center justify-end">
                <span className="text-accent-monero font-mono" aria-label="Hashrate value">
                  {formatHashrate(p.hashrate)}
                </span>
              </div>

              {/* Share Percentage */}
              <div className="flex sm:flex items-center justify-between gap-2 sm:justify-end">
                <span className="sm:hidden text-zinc-400">Share:</span>
                <span className="text-zinc-300" aria-label="Percent of total">
                  {pct > 0 ? pct.toFixed(1) : "0.0"}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with total */}
      {totalHash > 0 && (
        <div className="mt-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="uppercase tracking-widest text-zinc-500">Total Network</span>
            <span className="text-accent-monero">{formatHashrate(totalHash)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
