"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useNetworkData } from "@/hooks/use-network-data";
import type { MoneroStats } from "@/types/monero";

interface MoneroDashboardProps {
  initialData?: MoneroStats;
}

interface CustomTrackedNode {
  id: string;
  name: string;
  url: string;
  status: string;
  pingMs: number;
  height: number;
  lastCheckedAt: number;
}

const CUSTOM_NODES_STORAGE_KEY = "monerobar:custom-tracked-nodes";

function formatHashrateGh(hashrateHs: number): string {
  return `${(hashrateHs / 1_000_000_000).toFixed(2)} GH/s`;
}

function formatHashrateSmart(hashrateHs: number): string {
  if (hashrateHs > 1_000_000_000) {
    return `${(hashrateHs / 1_000_000_000).toFixed(2)} GH/s`;
  }

  if (hashrateHs >= 1_000_000) {
    return `${(hashrateHs / 1_000_000).toFixed(2)} MH/s`;
  }

  return `${(hashrateHs / 1_000).toFixed(2)} KH/s`;
}

function formatPing(pingMs: number): string {
  return `${Math.round(pingMs).toString().padStart(3, "0")}ms`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatElapsedAgo(fromIso: string, nowMs: number): string {
  if (!fromIso) {
    return "N/A";
  }

  const sourceMs = Date.parse(fromIso);

  if (!Number.isFinite(sourceMs)) {
    return "N/A";
  }

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - sourceMs) / 1000));
  const days = Math.floor(elapsedSeconds / 86_400);
  const hours = Math.floor((elapsedSeconds % 86_400) / 3_600);
  const minutes = Math.floor((elapsedSeconds % 3_600) / 60);
  const seconds = elapsedSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ago`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s ago`;
  }

  return `${seconds}s ago`;
}

function formatEpochElapsedAgo(timestampSeconds: number, nowMs: number): string {
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
    return "N/A";
  }

  const sourceMs = timestampSeconds * 1000;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - sourceMs) / 1000));
  const hours = Math.floor(elapsedSeconds / 3_600);
  const minutes = Math.floor((elapsedSeconds % 3_600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s ago`;
  }

  return `${seconds}s ago`;
}

function formatRewardXmr(atomicUnits: number): string {
  return `${(atomicUnits / 1_000_000_000_000).toFixed(4)} XMR`;
}

function formatRewardWithUsd(
  atomicUnits: number,
  priceUsd: number | null | undefined,
): string {
  const rewardXmr = atomicUnits / 1_000_000_000_000;
  const xmrValue = `${rewardXmr.toFixed(4)} XMR`;

  if (!priceUsd || !Number.isFinite(priceUsd) || priceUsd <= 0) {
    return xmrValue;
  }

  const rewardUsd = rewardXmr * priceUsd;
  const usdValue = `$${rewardUsd.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;

  return `${xmrValue} (${usdValue})`;
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortHash(hash: string): string {
  if (hash.length <= 20) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-10)}`;
}

function normalizeNodeUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    parsed.search = "";
    parsed.pathname =
      parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function buildAsciiBar(percentage: number): string {
  const total = 20;
  const filled = Math.max(
    0,
    Math.min(total, Math.round((percentage / 100) * total)),
  );
  return `[${"█".repeat(filled)}${"░".repeat(total - filled)}]`;
}
function buildAsciiBarSmall(percentage: number): string {
  const total = 8;
  const filled = Math.max(
    0,
    Math.min(total, Math.round((percentage / 100) * total)),
  );
  return `[${"█".repeat(filled)}${"░".repeat(total - filled)}]`;
}
export function MoneroDashboard({ initialData }: MoneroDashboardProps) {
  const { data, isLoading, isError, dataUpdatedAt } =
    useNetworkData(initialData);
  const [nowMs, setNowMs] = useState(() => initialData?.updatedAt ?? 0);
  const [openPopup, setOpenPopup] = useState<
    "pools" | "nodes" | "blocks" | "status" | null
  >(null);
  const [popupTab, setPopupTab] = useState<"info" | "list">("info");
  const [customNodes, setCustomNodes] = useState<CustomTrackedNode[]>([]);
  const [armedDeleteNodeId, setArmedDeleteNodeId] = useState<string | null>(
    null,
  );
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeUrl, setNewNodeUrl] = useState("");
  const [customNodeError, setCustomNodeError] = useState<string | null>(null);
  const customNodesRef = useRef<CustomTrackedNode[]>([]);

  const checkCustomNode = async (
    url: string,
  ): Promise<{ status: string; pingMs: number; height: number }> => {
    const REQUEST_TIMEOUT_MS = 8_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const candidates = (() => {
        try {
          const parsed = new URL(url);
          if (!parsed.pathname || parsed.pathname === "/") {
            return [`${url}/get_info`, url];
          }
          return [url];
        } catch {
          return [url];
        }
      })();

      for (const candidate of candidates) {
        try {
          const response = await fetch(candidate, {
            method: "GET",
            cache: "no-store",
            redirect: "follow",
            signal: controller.signal,
          });

          const pingMs = Math.max(0, Date.now() - startedAt);
          let height = 0;

          if (response.ok && candidate.endsWith("/get_info")) {
            try {
              const data = (await response.json()) as { height?: number };
              height = Math.max(0, Number(data.height ?? 0));
            } catch {
              // Fallback to 0 if JSON parsing fails
            }
          }

          return {
            status: "ONLINE",
            pingMs,
            height,
          };
        } catch {
          // Try next candidate
        }
      }

      return {
        status: "OFFLINE",
        pingMs: 0,
        height: 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleRemoveCustomNode = (nodeId: string) => {
    setArmedDeleteNodeId((current) => (current === nodeId ? null : current));
    setCustomNodes((previous) => previous.filter((node) => node.id !== nodeId));
  };

  const handleCustomNodeNameClick = (nodeId: string) => {
    if (armedDeleteNodeId === nodeId) {
      handleRemoveCustomNode(nodeId);
      return;
    }

    setArmedDeleteNodeId(nodeId);
  };

  const handleAddCustomNode = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setCustomNodeError(null);

    const trimmedName = newNodeName.trim();

    if (!trimmedName) {
      setCustomNodeError("NAME IS REQUIRED");
      return;
    }

    const normalizedUrl = normalizeNodeUrl(newNodeUrl);

    if (!normalizedUrl) {
      setCustomNodeError("INVALID NODE URL");
      return;
    }

    if (customNodes.some((node) => node.url === normalizedUrl)) {
      setCustomNodeError("NODE ALREADY TRACKED");
      return;
    }

    const nodeId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nodeName = trimmedName;

    const nextNode: CustomTrackedNode = {
      id: nodeId,
      name: nodeName,
      url: normalizedUrl,
      status: "CHECKING",
      pingMs: 0,
      height: 0,
      lastCheckedAt: Date.now(),
    };

    setCustomNodes((previous) => [...previous, nextNode]);
    setNewNodeName("");
    setNewNodeUrl("");

    try {
      const result = await checkCustomNode(normalizedUrl);

      setCustomNodes((previous) =>
        previous.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              status: result.status,
              pingMs: result.pingMs,
              height: result.height,
              lastCheckedAt: Date.now(),
            }
            : node,
        ),
      );
    } catch {
      setCustomNodes((previous) =>
        previous.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              status: "OFFLINE",
              pingMs: 0,
              height: 0,
              lastCheckedAt: Date.now(),
            }
            : node,
        ),
      );
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data?.updatedAt) {
      setNowMs(Date.now());
    }
  }, [data?.updatedAt]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_NODES_STORAGE_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as CustomTrackedNode[];

      if (!Array.isArray(parsed)) {
        return;
      }

      const restored = parsed
        .map((node) => {
          const normalizedUrl = normalizeNodeUrl(String(node.url ?? ""));

          if (!normalizedUrl) {
            return null;
          }

          return {
            id: String(
              node.id ?? `custom-${Math.random().toString(36).slice(2, 8)}`,
            ),
            name: String(node.name ?? "CUSTOM NODE"),
            url: normalizedUrl,
            status: String(node.status ?? "OFFLINE").toUpperCase(),
            pingMs: Math.max(0, Number(node.pingMs ?? 0)),
            height: Math.max(0, Number(node.height ?? 0)),
            lastCheckedAt: Math.max(0, Number(node.lastCheckedAt ?? 0)),
          };
        })
        .filter((node): node is CustomTrackedNode => node !== null);

      setCustomNodes(restored);
    } catch {
      setCustomNodes([]);
    }
  }, []);

  useEffect(() => {
    customNodesRef.current = customNodes;
    localStorage.setItem(CUSTOM_NODES_STORAGE_KEY, JSON.stringify(customNodes));
  }, [customNodes]);

  useEffect(() => {
    if (!dataUpdatedAt || customNodesRef.current.length === 0) {
      return;
    }

    let isCancelled = false;

    const refreshTrackedNodes = async () => {
      const snapshot = [...customNodesRef.current];
      const results = await Promise.all(
        snapshot.map(async (node) => {
          try {
            const result = await checkCustomNode(node.url);

            return {
              id: node.id,
              status: result.status,
              pingMs: result.pingMs,
              height: result.height,
            };
          } catch {
            return {
              id: node.id,
              status: "OFFLINE",
              pingMs: 0,
              height: 0,
            };
          }
        }),
      );

      if (isCancelled) {
        return;
      }

      const resultById = new Map(results.map((entry) => [entry.id, entry]));

      setCustomNodes((previous) =>
        previous.map((node) => {
          const next = resultById.get(node.id);

          if (!next) {
            return node;
          }

          return {
            ...node,
            status: next.status,
            pingMs: next.pingMs,
            height: next.height,
            lastCheckedAt: Date.now(),
          };
        }),
      );
    };

    void refreshTrackedNodes();

    return () => {
      isCancelled = true;
    };
  }, [dataUpdatedAt]);

  const view = useMemo(() => {
    if (!data) {
      return null;
    }

    const sortedPools = [...data.pools].sort((a, b) => b.hashrate - a.hashrate);
    const topPools = sortedPools.slice(0, 5);
    const otherPools = sortedPools.slice(5);

    const poolList = topPools.map((pool) => {
      const percentage =
        data.network.hashrate > 0
          ? (pool.hashrate / data.network.hashrate) * 100
          : 0;

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
        name: "Others",
        homeUrl: "",
        apiUrl: "",
        hashrate: otherHashrate,
        status: "COMBINED",
        percentage: otherPercentage,
        bar: buildAsciiBar(otherPercentage),
        barSmall: buildAsciiBarSmall(otherPercentage),
      });
    }

    const updateSeconds = Math.max(
      0,
      Math.floor((nowMs - data.updatedAt) / 1000),
    );
    const onlineNodes = data.nodes.filter(
      (node) => node.status.toUpperCase() === "ONLINE",
    );
    const onlineCustomNodes = customNodes.filter(
      (node) => node.status.toUpperCase() === "ONLINE",
    );
    const mergedOnlineNodes = [...onlineNodes, ...onlineCustomNodes];
    const info = data.info;

    return {
      height: data.network.height.toLocaleString(),
      difficulty: data.network.difficulty.toLocaleString(),
      hashrate: formatHashrateGh(data.network.hashrate),
      updatedAgo: `${updateSeconds}s ago`,
      pools: poolList,
      nodes: mergedOnlineNodes,
      chain: data.blocks
        ? {
          latestHeight: data.blocks.range.latestHeight.toLocaleString(),
          count: data.blocks.range.count,
          blocks: [...data.blocks.blocks]
            .sort((a, b) => b.height - a.height)
            .slice(0, 3)
            .sort((a, b) => a.height - b.height)
            .map((block) => ({
              height: block.height.toLocaleString(),
              age: formatEpochElapsedAgo(block.timestamp, nowMs),
              txes: block.numTxes,
              reward: formatRewardWithUsd(block.reward, info?.market.priceUsd),
              difficulty: formatCompactNumber(block.difficulty),
              hash: formatShortHash(block.hash),
              isOrphan: block.orphanStatus,
              depth: block.depth,
            })),
        }
        : null,
      xmrStatus: info
        ? {
          symbol: info.asset.symbol.toUpperCase(),
          name: info.asset.name,
          priceUsd: formatUsd(info.market.priceUsd),
          change24hPct: info.market.priceChange24hPct,
          change30dPct: info.market.priceChange30dPct,
          marketCapUsd: formatCompactUsd(info.market.marketCapUsd),
          volume24hUsd: formatCompactUsd(info.market.totalVolumeUsd),
          circulatingSupply: Math.floor(
            info.supply.circulating,
          ).toLocaleString(),
          updatedAtAgo: formatElapsedAgo(info.sourceUpdatedAt, nowMs),
        }
        : null,
    };
  }, [data, nowMs, customNodes]);

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
          <p className="text-right sm:text-right text-accent-monero">
            {view.height}
          </p>

          <p className="tracking-widest text-zinc-400">DIFFICULTY:</p>
          <p className="text-right sm:text-right">{view.difficulty}</p>

          <p className="tracking-widest text-zinc-400">HASHRATE:</p>
          <p className="text-right sm:text-right">{view.hashrate}</p>

          <p className="tracking-widest text-zinc-400">LAST_UPDATE:</p>
          <p className="text-right sm:text-right">{view.updatedAgo}</p>
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
              POOLS
            </p>
            <button
              onClick={() => {
                const nextPopup = openPopup === "pools" ? null : "pools";
                setOpenPopup(nextPopup);
                if (nextPopup) {
                  setPopupTab("info");
                }
              }}
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

          <Link
            href="/pools"
            className="inline-flex items-center gap-1 border border-white/20 px-2 py-1 text-[10px] sm:text-xs tracking-widest text-zinc-300 transition-colors hover:border-accent-monero hover:bg-white/10 hover:text-accent-monero whitespace-nowrap"
            aria-label="Open pool explorer"
          >
            <span>POOL EXPLORER</span>
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {openPopup === "pools" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
              <div className="mb-3 flex border border-white/20">
                <button
                  onClick={() => setPopupTab("info")}
                  className={`flex-1 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "info"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  INFO
                </button>
                <button
                  onClick={() => setPopupTab("list")}
                  className={`flex-1 border-l border-white/20 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "list"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  LIST
                </button>
              </div>

              {popupTab === "info" ? (
                <>
                  <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                    WHAT ARE POOLS?
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                    Mining pools are servers that coordinate the computational
                    work of multiple miners. Individual miners contribute their
                    computing power to the pool, and when the pool finds a valid
                    block, the reward is distributed among all participants
                    based on their contributed work.
                  </p>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                    Sometimes pool data might be inaccurate or missing due to
                    API issues or network problems. If you notice discrepancies,
                    please check back later or consider running your own node
                    for the most reliable data.
                  </p>
                </>
              ) : (
                <div className="mb-4">
                  <div className="grid grid-cols-[1fr_10ch_12ch] gap-2 border-b border-white/10 pb-1 text-zinc-400 text-xs sm:text-sm tracking-widest">
                    <p>NAME</p>
                    <p>STATUS</p>
                    <p className="text-right">HASHRATE</p>
                  </div>
                  <div className="mt-2 max-h-56 overflow-y-auto space-y-1">
                    {(data?.pools ?? []).map((pool) => (
                      <div
                        key={pool.name}
                        className="grid grid-cols-[1fr_10ch_12ch] gap-2 text-xs sm:text-sm"
                      >
                        <p className="truncate">{pool.name}</p>
                        <p className="text-zinc-300 truncate">
                          {pool.status.toUpperCase()}
                        </p>
                        <p className="text-right text-zinc-400">
                          {formatHashrateSmart(pool.hashrate)}
                        </p>
                      </div>
                    ))}
                    {(data?.pools ?? []).length === 0 && (
                      <p className="text-zinc-500 text-xs sm:text-sm">
                        NO POOLS AVAILABLE
                      </p>
                    )}
                  </div>
                </div>
              )}

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
            <div
              key={pool.name}
              className="block sm:grid sm:grid-cols-[18ch_1fr_8ch] sm:items-center sm:gap-2"
            >
              {pool.homeUrl ? (
                <a
                  href={pool.homeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex max-w-full items-center gap-1 text-xs sm:text-sm"
                >
                  <span className="truncate group-hover:underline">
                    {pool.name}
                  </span>
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
                <span className="block truncate text-xs sm:text-sm">
                  {pool.name}
                </span>
              )}
              <span className="text-zinc-400 sm:hidden block mt-1">
                {pool.barSmall}
              </span>
              <span className="text-zinc-400 hidden sm:block">{pool.bar}</span>
              <span className="text-right text-white text-xs sm:text-sm block mt-1 sm:mt-0">
                {pool.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
              BLOCKS
            </p>
            <button
              onClick={() => {
                const nextPopup = openPopup === "blocks" ? null : "blocks";
                setOpenPopup(nextPopup);
                if (nextPopup) {
                  setPopupTab("info");
                }
              }}
              className="flex items-center justify-center w-5 h-5 hover:opacity-70 transition-opacity"
              aria-label="Info about blockchain"
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

          <Link
            href="/blocks"
            className="inline-flex items-center gap-1 border border-white/20 px-2 py-1 text-[10px] sm:text-xs tracking-widest text-zinc-300 transition-colors hover:border-accent-monero hover:bg-white/10 hover:text-accent-monero whitespace-nowrap"
            aria-label="Open block explorer"
          >
            <span>BLOCK EXPLORER</span>
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {openPopup === "blocks" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
              <div className="mb-3 flex border border-white/20">
                <button
                  onClick={() => setPopupTab("info")}
                  className={`flex-1 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "info"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  INFO
                </button>
                <button
                  onClick={() => setPopupTab("list")}
                  className={`flex-1 border-l border-white/20 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "list"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  LIST
                </button>
              </div>

              {popupTab === "info" ? (
                <>
                  <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                    WHAT ARE BLOCKS?
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                    Blocks are batches of confirmed Monero transactions added to
                    the chain in sequence. Each new block extends the ledger,
                    contributes to cumulative difficulty, and secures earlier
                    history against reorganization.
                  </p>
                </>
              ) : (
                <div className="mb-4">
                  <div className="grid grid-cols-[12ch_8ch_1fr] gap-2 border-b border-white/10 pb-1 text-zinc-400 text-xs sm:text-sm tracking-widest">
                    <p>HEIGHT</p>
                    <p>TX</p>
                    <p className="text-right">REWARD</p>
                  </div>
                  <div className="mt-2 max-h-72 overflow-y-auto space-y-1">
                    {(data?.blocks?.blocks ?? [])
                      .slice()
                      .sort((a, b) => b.height - a.height)
                      .map((block) => (
                        <div
                          key={`popup-${block.height}`}
                          className="grid grid-cols-[12ch_8ch_1fr] gap-2 text-xs sm:text-sm"
                        >
                          <p>{block.height.toLocaleString()}</p>
                          <p>{block.numTxes}</p>
                          <p className="text-right text-zinc-400">
                            {formatRewardWithUsd(
                              block.reward,
                              data?.info?.market.priceUsd,
                            )}
                          </p>
                        </div>
                      ))}
                    {(data?.blocks?.blocks ?? []).length === 0 && (
                      <p className="text-zinc-500 text-xs sm:text-sm">
                        NO BLOCKS AVAILABLE
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setOpenPopup(null)}
                className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {view.chain && view.chain.blocks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {view.chain.blocks.map((block) => (
                <div
                  key={block.height}
                  className="border border-white/10 p-2 min-h-24 sm:min-h-28"
                >
                  <p className="truncate text-accent-monero text-xs sm:text-sm">
                    {`[#${block.height}]${block.isOrphan ? " [ORPHAN]" : ""}`}
                  </p>
                  <p className="mt-2 text-zinc-300 text-xs sm:text-sm">{`AGE   ${block.age}`}</p>
                  <p className="text-zinc-300 text-xs sm:text-sm">{`TX    ${block.txes}`}</p>
                  <p className="mt-2 text-zinc-400 text-xs sm:text-sm">{`REWARD ${block.reward}`}</p>
                  <p className="text-zinc-400 text-xs sm:text-sm">{`DIFF   ${block.difficulty}`}</p>
                  <p className="mt-2 truncate text-zinc-500 text-xs sm:text-sm">{`HASH ${block.hash}`}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-zinc-500 text-xs sm:text-sm">
            NO BLOCK DATA AVAILABLE
          </p>
        )}
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
            NODES
          </p>
          <button
            onClick={() => {
              const nextPopup = openPopup === "nodes" ? null : "nodes";
              setOpenPopup(nextPopup);
              if (nextPopup) {
                setPopupTab("info");
              }
            }}
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
              <div className="mb-3 flex border border-white/20">
                <button
                  onClick={() => setPopupTab("info")}
                  className={`flex-1 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "info"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  INFO
                </button>
                <button
                  onClick={() => setPopupTab("list")}
                  className={`flex-1 border-l border-white/20 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "list"
                    ? "bg-white/10 text-accent-monero"
                    : "text-zinc-400 hover:bg-white/5"
                    }`}
                >
                  LIST
                </button>
              </div>

              {popupTab === "info" ? (
                <>
                  <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                    WHAT ARE NODES?
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                    Nodes are computers running the full Monero blockchain. They
                    validate transactions, maintain a complete copy of the
                    ledger, and relay information across the network. A healthy
                    node is essential for network security and transaction
                    verification.
                  </p>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                    Node status may be affected by network issues, maintenance,
                    or other factors. If you see a node marked as offline, it
                    may be temporary. For the most accurate and up-to-date
                    information, consider running your own node or checking
                    multiple sources.
                  </p>
                </>
              ) : (
                <div className="mb-4">
                  <form
                    onSubmit={handleAddCustomNode}
                    className="mb-3 space-y-2 border border-white/10 p-2"
                  >
                    <p className="text-zinc-400 text-xs tracking-widest">
                      TRACK YOUR OWN NODE
                    </p>
                    <input
                      value={newNodeName}
                      onChange={(event) => setNewNodeName(event.target.value)}
                      placeholder="NAME (E.G. Mullvad)"
                      className="w-full border border-white/20 bg-black px-2 py-1 text-xs sm:text-sm outline-none focus:border-white/40"
                    />
                    <input
                      value={newNodeUrl}
                      onChange={(event) => setNewNodeUrl(event.target.value)}
                      placeholder="NODE URL (E.G. node.example.com:18081)"
                      className="w-full border border-white/20 bg-black px-2 py-1 text-xs sm:text-sm outline-none focus:border-white/40"
                    />
                    {customNodeError && (
                      <p className="text-status-offline text-xs">
                        [!] {customNodeError}
                      </p>
                    )}
                    <p className="text-zinc-500 text-xs">
                      CORS should be disabled on the node to connect.
                    </p>
                    <button
                      type="submit"
                      className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
                    >
                      ADD NODE
                    </button>
                  </form>

                  <div className="grid grid-cols-[1fr_10ch_8ch] gap-2 border-b border-white/10 pb-1 text-zinc-400 text-xs sm:text-sm tracking-widest">
                    <p>NAME</p>
                    <p>STATUS</p>
                    <p className="text-right">PING</p>
                  </div>
                  <div
                    className="mt-2 max-h-56 overflow-y-auto space-y-1"
                    onClick={() => setArmedDeleteNodeId(null)}
                  >
                    {[...(data?.nodes ?? []), ...customNodes].map((node) => {
                      const isCustom = "id" in node;
                      const nodeId = isCustom ? node.id : null;
                      const isArmedForDelete =
                        isCustom && armedDeleteNodeId === nodeId;

                      return (
                        <div
                          key={nodeId ?? `api-${node.url}-${node.name}`}
                          className={`grid grid-cols-[1fr_10ch_8ch] gap-2 text-xs sm:text-sm items-center transition-all ${isArmedForDelete ? "rounded-sm bg-status-offline/15 shadow-[0_0_0_1px_rgba(239,68,68,0.75),0_0_14px_rgba(239,68,68,0.45)]" : ""}`}
                        >
                          {isCustom && nodeId ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCustomNodeNameClick(nodeId);
                              }}
                              className={`truncate text-left transition-colors ${isArmedForDelete
                                ? "text-status-offline"
                                : "hover:text-status-offline"
                                }`}
                            >
                              {node.name}
                            </button>
                          ) : (
                            <p className="truncate">{node.name}</p>
                          )}
                          <p
                            className={
                              node.status.toUpperCase() === "ONLINE"
                                ? "text-status-online truncate"
                                : "text-status-offline truncate"
                            }
                          >
                            {node.status.toUpperCase()}
                          </p>
                          <p className="text-right">
                            {formatPing(node.pingMs)}
                          </p>
                        </div>
                      );
                    })}
                    {(data?.nodes ?? []).length === 0 &&
                      customNodes.length === 0 && (
                        <p className="text-zinc-500 text-xs sm:text-sm">
                          NO NODES AVAILABLE
                        </p>
                      )}
                  </div>
                </div>
              )}

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
            <div
              key={node.name}
              className="block sm:hidden border border-white/10 p-2 space-y-1"
            >
              <p className="truncate font-mono text-xs">{node.name}</p>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">STATUS:</p>
                <p
                  className={
                    node.status.toUpperCase() === "ONLINE"
                      ? "text-status-online"
                      : "text-status-offline"
                  }
                >
                  [ {node.status.toUpperCase()} ]
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">PING:</p>
                <p>{formatPing(node.pingMs)}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <p className="text-zinc-400">HEIGHT:</p>
                <p>{"height" in node ? node.height.toLocaleString() : "N/A"}</p>
              </div>
            </div>
          ))}
          <div className="hidden sm:grid grid-cols-[18ch_12ch_8ch_1fr] gap-x-2 gap-y-0 items-center">
            {view.nodes.map((node) => (
              <div key={node.name} className="contents">
                <p className="truncate font-mono">{node.name}</p>
                <p
                  className={
                    node.status.toUpperCase() === "ONLINE"
                      ? "text-status-online"
                      : "text-status-offline"
                  }
                >
                  [ {node.status.toUpperCase()} ]
                </p>
                <p className="text-right">{formatPing(node.pingMs)}</p>
                <p className="text-right">
                  {"height" in node ? node.height.toLocaleString() : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
            MARKETS
          </p>
          <button
            type="button"
            onClick={() => {
              const nextPopup = openPopup === "status" ? null : "status";
              setOpenPopup(nextPopup);
            }}
            className="flex items-center justify-center w-5 h-5 hover:opacity-70 transition-opacity"
            aria-label="Info about current Monero status"
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

        {openPopup === "status" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                Market data provided by{" "}
                <a
                  href="https://www.coingecko.com/en/coins/monero"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-monero underline hover:opacity-80"
                >
                  CoinGecko
                </a>
                . Data is not investment advice. Always do your own research before making financial decisions.
              </p>

              <button
                type="button"
                onClick={() => setOpenPopup(null)}
                className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {view.xmrStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-[16ch_1fr] gap-y-1 gap-x-2">
            <p className="tracking-widest text-zinc-400">ASSET:</p>
            <p className="text-right text-accent-monero">
              {view.xmrStatus.name} ({view.xmrStatus.symbol})
            </p>

            <p className="tracking-widest text-zinc-400">PRICE:</p>
            <p className="text-right">{view.xmrStatus.priceUsd}</p>

            <p className="tracking-widest text-zinc-400">24H CHANGE:</p>
            <p
              className={`text-right ${view.xmrStatus.change24hPct >= 0 ? "text-status-online" : "text-status-offline"}`}
            >
              {formatSignedPercent(view.xmrStatus.change24hPct)}
            </p>

            <p className="tracking-widest text-zinc-400">30D CHANGE:</p>
            <p
              className={`text-right ${view.xmrStatus.change30dPct >= 0 ? "text-status-online" : "text-status-offline"}`}
            >
              {formatSignedPercent(view.xmrStatus.change30dPct)}
            </p>

            <p className="tracking-widest text-zinc-400">MARKET CAP:</p>
            <p className="text-right">{view.xmrStatus.marketCapUsd}</p>

            <p className="tracking-widest text-zinc-400">24H VOLUME:</p>
            <p className="text-right">{view.xmrStatus.volume24hUsd}</p>

            <p className="tracking-widest text-zinc-400">CIRC SUPPLY:</p>
            <p className="text-right">{view.xmrStatus.circulatingSupply} XMR</p>

            <p className="tracking-widest text-zinc-400">UPDATED:</p>
            <p className="text-right">{view.xmrStatus.updatedAtAgo}</p>
          </div>
        ) : (
          <p className="text-zinc-500 text-xs sm:text-sm">
            NO MONERO STATUS DATA AVAILABLE
          </p>
        )}
      </section>
    </div>
  );
}
