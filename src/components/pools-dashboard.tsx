"use client";

import React, { useMemo } from "react";
import type { PoolsApiResponse, PoolApiItem } from "@/types/pools";

type DonutSlice = {
  label: string;
  value: number; // percentage 0-100
  color: string;
};

function donutSlicePath(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  // Convert angles to radians and compute points on the two circles
  const startOuter = {
    x: cx + outerR * Math.cos((startAngle * Math.PI) / 180),
    y: cy + outerR * Math.sin((startAngle * Math.PI) / 180),
  };
  const endOuter = {
    x: cx + outerR * Math.cos((endAngle * Math.PI) / 180),
    y: cy + outerR * Math.sin((endAngle * Math.PI) / 180),
  };
  const endInner = {
    x: cx + innerR * Math.cos((endAngle * Math.PI) / 180),
    y: cy + innerR * Math.sin((endAngle * Math.PI) / 180),
  };
  const startInner = {
    x: cx + innerR * Math.cos((startAngle * Math.PI) / 180),
    y: cy + innerR * Math.sin((startAngle * Math.PI) / 180),
  };

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({ segments, size = 220 }: { segments: DonutSlice[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.28; // donut thickness
  const outerR = size * 0.45;

  let currentAngle = -90; // start at top
  const paths = segments.map((s) => {
    const angle = (s.value / 100) * 360;
    const path = donutSlicePath(cx, cy, innerR, outerR, currentAngle, currentAngle + angle);
    currentAngle += angle;
    return { ...s, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Pool distribution donut chart">
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1f2937" strokeWidth={2} />
      {paths.map((p, idx) => (
        <path key={idx} d={p.path} fill={p.color} />
      ))}
      {/* Center label */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={12} fontFamily="monospace">
        Distribution
      </text>
    </svg>
  );
}

type PoolsOverviewProps = {
  data?: PoolsApiResponse;
};

export function PoolsOverview({ data }: PoolsOverviewProps) {
  if (!data?.pools || data.pools.length === 0) {
    return (
      <div className="text-zinc-400 text-xs sm:text-sm">No pool data available</div>
    );
  }

  // Compute distribution
  const totalHashrate = data.network?.hashrate ?? data.pools.reduce((s, p) => s + p.hashrate, 0);
  const segments: DonutSlice[] = data.pools.map((p, idx) => {
    const percentage = totalHashrate > 0 ? (p.hashrate / totalHashrate) * 100 : 0;
    const color = colorForIndex(idx);
    return { label: p.name, value: percentage, color };
  });

  // Bar chart data: show per-pool hashrate with color mapping
  const maxHash = Math.max(1, ...data.pools.map((p) => p.hashrate));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="flex flex-col items-center justify-center hidden">
        <DonutChart segments={segments} />
        <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
          {data.pools.map((p, idx) => (
            <div key={p.name} className="text-xs text-zinc-300 flex flex-col items-center mx-2" style={{ minWidth: 90 }}>
              <span className="block h-2 w-8" style={{ background: "#ffffff" }} />
              <span className="mt-1 text-center truncate w-28" title={p.name}>{p.name}</span>
              <span className="text-zinc-400">{((p.hashrate / 1_000_000_000)).toFixed(2)} GH/s</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-white/10 rounded-none p-3 sm:p-4 bg-black/40">
        <div className="mb-2 text-xs uppercase tracking-widest text-zinc-400">Pool Hashrates</div>
        <div className="space-y-2">
          {data.pools.map((p, idx) => {
            const w = Math.round((p.hashrate / maxHash) * 100);
            return (
              <div key={p.name} className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-28 text-left truncate" title={p.name}>{p.name}</div>
                <div className="flex-1 h-4 bg-white/10" aria-label={`Hashrate bar for ${p.name}`}>
                  <div
                    className="h-4 bg-white"
                    style={{ width: `${w}%` }}
                    title={`${p.hashrate.toLocaleString()} H/s`}
                  />
                </div>
                <div className="w-24 text-right text-zinc-300" aria-label="Hashrate value">
                  {humanHash(p.hashrate)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function colorForIndex(i: number): string {
  const colors = [
    "#f87171", // red-400
    "#f59e0b", // amber-500
    "#34d399", // emerald-400
    "#60a5fa", // blue-400
    "#a78bfa", // violet-400
    "#f472b6", // pink-400
  ];
  return colors[i % colors.length];
}

function humanHash(h: number): string {
  // Pretty print as GH/s or TH/s depending on magnitude
  if (h >= 1_000_000_000) {
    return `${(h / 1_000_000_000).toFixed(2)} GH/s`;
  }
  if (h >= 1_000_000) {
    return `${(h / 1_000_000).toFixed(2)} MH/s`;
  }
  if (h >= 1_000) {
    return `${(h / 1_000).toFixed(2)} KH/s`;
  }
  return `${h} H/s`;
}
