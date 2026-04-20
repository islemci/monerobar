"use client";

import { useMemo, useState, useEffect } from "react";
import { useNetworkData } from "@/hooks/use-network-data";
import type { MoneroStats } from "@/types/monero";

interface MoneroDashboardProps {
  initialData?: MoneroStats;
}

function formatHashrateGh(hashrateHs: number): string {
  return `${(hashrateHs / 1_000_000_000).toFixed(2)} GH/s`;
}

function formatPing(pingMs: number): string {
  return `${Math.round(pingMs).toString().padStart(3, "0")}ms`;
}

function buildAsciiBar(percentage: number): string {
  const total = 20;
  const filled = Math.max(0, Math.min(total, Math.round((percentage / 100) * total)));
  return `[${"█".repeat(filled)}${"░".repeat(total - filled)}]`;
}
function buildAsciiBarSmall(percentage: number): string {
  const total = 8;
  const filled = Math.max(0, Math.min(total, Math.round((percentage / 100) * total)));
  return `[${"█".repeat(filled)}${"░".repeat(total - filled)}]`;
}
export function MoneroDashboard({ initialData }: MoneroDashboardProps) {
  const { data, isLoading, isError, dataUpdatedAt } = useNetworkData(initialData);
  const [nowMs, setNowMs] = useState(Date.now());
  const [openPopup, setOpenPopup] = useState<"pools" | "nodes" | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const view = useMemo(() => {
    if (!data) {
      return null;
    }

    const sortedPools = [...data.pools].sort((a, b) => b.hashrate - a.hashrate);
    const topPools = sortedPools.slice(0, 5);
    const otherPools = sortedPools.slice(5);

    const poolList = topPools.map((pool) => {
      const percentage =
        data.network.hashrate > 0 ? (pool.hashrate / data.network.hashrate) * 100 : 0;

      return {
        ...pool,
        percentage,
        bar: buildAsciiBar(percentage),
        barSmall: buildAsciiBarSmall(percentage),
      };
    });

    const topPercentageSum = poolList.reduce((sum, p) => sum + p.percentage, 0);
    const otherPercentage = Math.max(0, 100 - topPercentageSum);

    if (otherPercentage > 0 || otherPools.length > 0) {
      const otherHashrate = otherPools.reduce((sum, p) => sum + p.hashrate, 0);

      poolList.push({
        name: "Other",
        homeUrl: "",
        apiUrl: "",
        hashrate: otherHashrate,
        status: "COMBINED",
        percentage: otherPercentage,
        bar: buildAsciiBar(otherPercentage),
        barSmall: buildAsciiBarSmall(otherPercentage),
      });
    }

    const lastStatusRefreshAt = dataUpdatedAt > 0 ? dataUpdatedAt : data.updatedAt;
    const updateSeconds = Math.max(0, Math.floor((nowMs - lastStatusRefreshAt) / 1000));

    return {
      height: data.network.height.toLocaleString(),
      difficulty: data.network.difficulty.toLocaleString(),
      hashrate: formatHashrateGh(data.network.hashrate),
      updatedAgo: `${updateSeconds}s ago`,
      pools: poolList,
      nodes: data.nodes,
    };
  }, [data, nowMs, dataUpdatedAt]);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm tracking-tighter text-white">
          [ FETCHING_BLOCK_DATA... ]
        </p>
      </div>
    );
  }

  if (isError || !view) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm tracking-tighter text-status-offline">
          [!] SYSTEM_OFFLINE: UNABLE TO REACH AGGREGATOR.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 font-mono text-xs sm:text-sm tracking-tighter text-white sm:gap-4">
      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-[14ch_1fr] gap-y-1 gap-x-2">
          <p className="tracking-widest text-zinc-400">BLOCK_HEIGHT:</p>
          <p className="text-right sm:text-right text-accent-monero">{view.height}</p>

          <p className="tracking-widest text-zinc-400">DIFFICULTY:</p>
          <p className="text-right sm:text-right">{view.difficulty}</p>

          <p className="tracking-widest text-zinc-400">HASHRATE:</p>
          <p className="text-right sm:text-right">{view.hashrate}</p>

          <p className="tracking-widest text-zinc-400">LAST_UPDATE:</p>
          <p className="text-right sm:text-right">{view.updatedAgo}</p>
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">POOLS</p>
          <button
            onClick={() => setOpenPopup(openPopup === "pools" ? null : "pools")}
            className="flex items-center justify-center w-5 h-5 hover:opacity-70 transition-opacity"
            aria-label="Info about pools"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>

        {openPopup === "pools" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
              <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">WHAT ARE POOLS?</h3>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                Mining pools are servers that coordinate the computational work of multiple miners. Individual miners contribute their computing power to the pool, and when the pool finds a valid block, the reward is distributed among all participants based on their contributed work.
              </p>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                Sometimes pool data might be inaccurate or missing due to API issues or network problems. If you notice discrepancies, please check back later or consider running your own node for the most reliable data.
              </p>
              <button
                onClick={() => setOpenPopup(null)}
                className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:gap-1">
          {view.pools.map((pool) => (
            <div key={pool.name} className="block sm:grid sm:grid-cols-[18ch_1fr_8ch] sm:items-center sm:gap-2">
              {pool.homeUrl ? (
                <a
                  href={pool.homeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex max-w-full items-center gap-1 text-xs sm:text-sm"
                >
                  <span className="truncate group-hover:underline">{pool.name}</span>
                  <span className="inline-flex h-3 w-3 items-center justify-center border-b border-transparent group-hover:border-current">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-3 w-3"
                    >
                      <path d="M7 7h10v10" />
                      <path d="M7 17 17 7" />
                    </svg>
                  </span>
                </a>
              ) : (
                <span className="block truncate text-xs sm:text-sm">{pool.name}</span>
              )}
              <span className="text-zinc-400 sm:hidden block mt-1">{pool.barSmall}</span>
              <span className="text-zinc-400 hidden sm:block">{pool.bar}</span>
              <span className="text-right text-white text-xs sm:text-sm block mt-1 sm:mt-0">{pool.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">NODES</p>
          <button
            onClick={() => setOpenPopup(openPopup === "nodes" ? null : "nodes")}
            className="flex items-center justify-center w-5 h-5 hover:opacity-70 transition-opacity"
            aria-label="Info about nodes"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>

        {openPopup === "nodes" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
              <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">WHAT ARE NODES?</h3>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                Nodes are computers running the full Monero blockchain. They validate transactions, maintain a complete copy of the ledger, and relay information across the network. A healthy node is essential for network security and transaction verification.
              </p>
              <button
                onClick={() => setOpenPopup(null)}
                className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        <div className="hidden sm:grid grid-cols-[18ch_12ch_8ch_1fr] gap-2 tracking-widest text-zinc-400">
          <p>NAME</p>
          <p>STATUS</p>
          <p className="text-right">PING</p>
          <p className="text-right">HEIGHT</p>
        </div>
        <div className="my-1 border-t border-white/10 hidden sm:block" />
        <div className="space-y-2 sm:space-y-1">
          {view.nodes.map((node) => (
            <div key={node.name} className="block sm:hidden border border-white/10 p-2 space-y-1">
              <p className="truncate font-mono text-xs">{node.name}</p>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">STATUS:</p>
                <p className={node.status.toUpperCase() === "ONLINE" ? "text-status-online" : "text-status-offline"}>
                  [ {node.status.toUpperCase()} ]
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">PING:</p>
                <p>{formatPing(node.pingMs)}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">HEIGHT:</p>
                <p>{node.height.toLocaleString()}</p>
              </div>
            </div>
          ))}
          <div className="hidden sm:grid grid-cols-[18ch_12ch_8ch_1fr] gap-x-2 gap-y-0 items-center">
            {view.nodes.map((node) => (
              <div key={node.name} className="contents">
                <p className="truncate font-mono">{node.name}</p>
                <p className={node.status.toUpperCase() === "ONLINE" ? "text-status-online" : "text-status-offline"}>
                  [ {node.status.toUpperCase()} ]
                </p>
                <p className="text-right">{formatPing(node.pingMs)}</p>
                <p className="text-right">{node.height.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
