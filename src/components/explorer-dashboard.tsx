"use client";

import { useState, useMemo, useEffect } from "react";
import type { ExplorerData } from "@/types/explorer";

interface ExplorerDashboardProps {
  initialData?: ExplorerData;
}

function formatRewardXmr(atomicUnits: number): string {
  return `${(atomicUnits / 1_000_000_000_000).toFixed(4)} XMR`;
}

function formatSizeKb(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatShortHash(hash: string): string {
  if (hash.length <= 16) {
    return hash;
  }

  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

function getBlockObserverUrl(hash: string): string {
  return `https://blocks.p2pool.observer/block/${hash}`;
}

function BlockHashLink({ hash }: { hash: string }) {
  return (
    <a
      href={getBlockObserverUrl(hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
      onClick={(event) => event.stopPropagation()}
      aria-label={`Open block ${hash} on p2pool observer`}
    >
      <span className="truncate">{formatShortHash(hash)}</span>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
      >
        <path
          d="M11 4h5v5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 4l-7 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 10.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

function formatCompactDifficulty(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}G`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }

  return value.toString();
}

function formatAge(timestampSeconds: number, nowMs: number): string {
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

const ITEMS_PER_PAGE = 25;

export function ExplorerDashboard({ initialData }: ExplorerDashboardProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [page, setPage] = useState(0);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [isBlocksInfoOpen, setIsBlocksInfoOpen] = useState(false);
  const [blocksInfoTab, setBlocksInfoTab] = useState<"info" | "glossary">("info");

  // Tick the clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sortedBlocks = useMemo(() => {
    if (!initialData?.blocks) {
      return [];
    }

    return [...initialData.blocks].sort((a, b) => b.height - a.height);
  }, [initialData?.blocks]);

  const totalPages = Math.max(1, Math.ceil(sortedBlocks.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageBlocks = sortedBlocks.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  if (!initialData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm tracking-tighter text-status-offline">
          [!] NO EXPLORER DATA AVAILABLE
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 font-mono text-xs sm:text-sm tracking-tighter text-white sm:gap-4">
      {/* Chain Summary */}
      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center gap-1">
          <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
            CHAIN OVERVIEW
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[16ch_1fr] gap-y-1 gap-x-2">
          <p className="tracking-widest text-zinc-400">HEIGHT:</p>
          <p className="text-right text-accent-monero">
            {initialData.range.latestHeight.toLocaleString()}
          </p>

          <p className="tracking-widest text-zinc-400">RANGE:</p>
          <p className="text-right">
            {initialData.range.startHeight.toLocaleString()} → {initialData.range.latestHeight.toLocaleString()}
          </p>

          <p className="tracking-widest text-zinc-400">BLOCKS_LOADED:</p>
          <p className="text-right">{initialData.range.count}</p>

          <p className="tracking-widest text-zinc-400">SOURCE_NODE:</p>
          <p className="text-right truncate text-zinc-300">
            {initialData.node || "N/A"}
          </p>
        </div>
      </section>

      {/* Blocks Table - Desktop */}
      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="relative flex items-center gap-1">
            <p className="tracking-widest text-zinc-400 text-xs sm:text-sm">
              BLOCKS
            </p>
            <button
              onClick={() => {
                const nextOpen = !isBlocksInfoOpen;
                setIsBlocksInfoOpen(nextOpen);
                if (nextOpen) {
                  setBlocksInfoTab("info");
                }
              }}
              className="flex items-center justify-center w-5 h-5 hover:opacity-70 transition-opacity"
              aria-label="Info about explorer blocks"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setPage(0)}
                disabled={currentPage === 0}
                className="px-1.5 py-0.5 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent tracking-widest"
              >
                ««
              </button>
              <button
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-1.5 py-0.5 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent tracking-widest"
              >
                «
              </button>
              <span className="px-2 text-zinc-400 tracking-widest">
                {currentPage + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-1.5 py-0.5 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent tracking-widest"
              >
                »
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-1.5 py-0.5 border border-white/20 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent tracking-widest"
              >
                »»
              </button>
            </div>
          )}
        </div>

        {/* Desktop Table Header */}
        <div className="hidden sm:grid grid-cols-[12ch_13ch_10ch_7ch_16ch_minmax(20ch,1fr)] gap-3 tracking-widest text-zinc-400 text-xs sm:text-sm">
          <p>HEIGHT</p>
          <p>AGE</p>
          <p className="text-right">SIZE</p>
          <p className="text-right">TXS</p>
          <p className="text-right">REWARD</p>
          <p className="text-right">HASH</p>
        </div>
        <div className="my-1 border-t border-white/10 hidden sm:block" />

        {/* Desktop Table Rows */}
        <div className="hidden sm:block space-y-0">
          {pageBlocks.map((block) => {
            const isExpanded = expandedBlock === block.height;

            return (
              <div key={block.height}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedBlock(isExpanded ? null : block.height)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setExpandedBlock(isExpanded ? null : block.height);
                    }
                  }}
                  className={`w-full grid grid-cols-[12ch_13ch_10ch_7ch_16ch_minmax(20ch,1fr)] gap-3 text-xs sm:text-sm py-1 text-left hover:bg-white/5 ${isExpanded ? "bg-white/5" : ""
                    }`}
                >
                  <p className="text-accent-monero">
                    {block.height.toLocaleString()}
                  </p>
                  <p className="text-zinc-300">
                    {formatAge(block.timestamp, nowMs)}
                  </p>
                  <p className="text-right text-zinc-300">
                    {formatSizeKb(block.blockWeight)}
                  </p>
                  <p className="text-right text-white">
                    {block.txCount}
                  </p>
                  <p className="text-right text-zinc-300">
                    {formatRewardXmr(block.reward)}
                  </p>
                  <p className="text-right text-zinc-500 truncate flex justify-end">
                    <BlockHashLink hash={block.hash} />
                  </p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border border-white/10 bg-white/[0.02] p-3 mb-1 grid grid-cols-[18ch_1fr] gap-y-1.5 gap-x-3 text-xs">
                    <p className="tracking-widest text-zinc-400">FULL_HASH:</p>
                    <p className="text-zinc-300 break-all">{block.hash}</p>

                    <p className="tracking-widest text-zinc-400">PREV_HASH:</p>
                    <p className="text-zinc-300 break-all">{block.prevHash}</p>

                    <p className="tracking-widest text-zinc-400">DIFFICULTY:</p>
                    <p className="text-zinc-300">
                      {block.difficulty.toLocaleString()} ({formatCompactDifficulty(block.difficulty)})
                    </p>

                    <p className="tracking-widest text-zinc-400">BLOCK_WEIGHT:</p>
                    <p className="text-zinc-300">
                      {block.blockWeight.toLocaleString()} bytes ({formatSizeKb(block.blockWeight)})
                    </p>

                    <p className="tracking-widest text-zinc-400">REWARD:</p>
                    <p className="text-zinc-300">{formatRewardXmr(block.reward)}</p>

                    <p className="tracking-widest text-zinc-400">TX_COUNT:</p>
                    <p className="text-zinc-300">{block.txCount}</p>

                    <p className="tracking-widest text-zinc-400">NONCE:</p>
                    <p className="text-zinc-300">{block.nonce.toLocaleString()}</p>

                    <p className="tracking-widest text-zinc-400">ORPHAN:</p>
                    <p className={block.header.orphanStatus ? "text-status-offline" : "text-status-online"}>
                      {block.header.orphanStatus ? "YES" : "NO"}
                    </p>

                    <p className="tracking-widest text-zinc-400">TIMESTAMP:</p>
                    <p className="text-zinc-300">
                      {new Date(block.timestamp * 1000).toUTCString()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2">
          {pageBlocks.map((block) => {
            const isExpanded = expandedBlock === block.height;

            return (
              <div
                key={block.height}
                role="button"
                tabIndex={0}
                onClick={() =>
                  setExpandedBlock(isExpanded ? null : block.height)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedBlock(isExpanded ? null : block.height);
                  }
                }}
                className={`w-full text-left border border-white/10 p-2 space-y-1 hover:bg-white/5 ${isExpanded ? "bg-white/5" : ""
                  }`}
              >
                <p className="text-accent-monero text-xs font-mono">
                  [#{block.height.toLocaleString()}]
                  {block.header.orphanStatus ? " [ORPHAN]" : ""}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">AGE:</span>
                  <span>{formatAge(block.timestamp, nowMs)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">TXS:</span>
                  <span>{block.txCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">SIZE:</span>
                  <span>{formatSizeKb(block.blockWeight)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">REWARD:</span>
                  <span>{formatRewardXmr(block.reward)}</span>
                </div>
                <p className="text-zinc-500 text-xs truncate flex items-center gap-1">
                  <BlockHashLink hash={block.hash} />
                </p>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">DIFFICULTY:</span>
                      <span className="text-zinc-300">{formatCompactDifficulty(block.difficulty)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">WEIGHT:</span>
                      <span className="text-zinc-300">{block.blockWeight.toLocaleString()} B</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">NONCE:</span>
                      <span className="text-zinc-300">{block.nonce.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">ORPHAN:</span>
                      <span className={block.header.orphanStatus ? "text-status-offline" : "text-status-online"}>
                        {block.header.orphanStatus ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="text-xs">
                      <p className="text-zinc-400 mb-0.5">FULL_HASH:</p>
                      <p className="text-zinc-300 break-all text-[10px]">{block.hash}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-zinc-400 mb-0.5">PREV_HASH:</p>
                      <p className="text-zinc-300 break-all text-[10px]">{block.prevHash}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-zinc-400 mb-0.5">TIMESTAMP:</p>
                      <p className="text-zinc-300">{new Date(block.timestamp * 1000).toUTCString()}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedBlocks.length === 0 && (
          <p className="text-zinc-500 text-xs sm:text-sm py-4 text-center">
            NO BLOCKS AVAILABLE
          </p>
        )}
      </section>

      {isBlocksInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-2xl w-full">
            <div className="mb-3 flex border border-white/20">
              <button
                onClick={() => setBlocksInfoTab("info")}
                className={`flex-1 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${blocksInfoTab === "info"
                  ? "bg-white/10 text-accent-monero"
                  : "text-zinc-400 hover:bg-white/5"
                  }`}
              >
                INFO
              </button>
              <button
                onClick={() => setBlocksInfoTab("glossary")}
                className={`flex-1 border-l border-white/20 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${blocksInfoTab === "glossary"
                  ? "bg-white/10 text-accent-monero"
                  : "text-zinc-400 hover:bg-white/5"
                  }`}
              >
                GLOSSARY
              </button>
            </div>

            {blocksInfoTab === "info" ? (
              <div className="mb-4 space-y-2 text-xs sm:text-sm leading-relaxed text-zinc-300">
                <p>
                  This table shows the latest blocks in descending height.
                  Select a row to expand full block metadata including full
                  hash, previous hash, nonce, and orphan status.
                </p>
                <p>
                  Age updates every second relative to your current time, and
                  size is displayed in bytes/KB for quick scanning.
                </p>
              </div>
            ) : (
              <div className="mb-4 max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div>
                  <p className="text-accent-monero tracking-widest">HEIGHT</p>
                  <p className="text-zinc-400 leading-relaxed">
                    The sequential position of a block in the blockchain. Each new block increments the height by one.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">DIFFICULTY</p>
                  <p className="text-zinc-400 leading-relaxed">
                    A measure of how hard it is to mine a block. The network adjusts difficulty to maintain a ~2 minute block time.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">REWARD</p>
                  <p className="text-zinc-400 leading-relaxed">
                    The amount of XMR paid to the miner who successfully mines a block. This includes the base reward plus transaction fees.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">TX COUNT</p>
                  <p className="text-zinc-400 leading-relaxed">
                    The number of transactions included in the block. Blocks with 0 transactions contain only the coinbase (miner reward) transaction.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">BLOCK WEIGHT</p>
                  <p className="text-zinc-400 leading-relaxed">
                    The size of the block in bytes. Monero uses a dynamic block size that adjusts based on demand, with a penalty for oversized blocks.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">NONCE</p>
                  <p className="text-zinc-400 leading-relaxed">
                    A number that miners iterate over when trying to find a valid block hash. It is part of the proof-of-work mechanism.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">HASH</p>
                  <p className="text-zinc-400 leading-relaxed">
                    A unique cryptographic fingerprint of the block. Each block references the hash of the previous block, forming the chain.
                  </p>
                </div>
                <div>
                  <p className="text-accent-monero tracking-widest">ORPHAN</p>
                  <p className="text-zinc-400 leading-relaxed">
                    A valid block that was not included in the main chain, usually because another block at the same height was accepted first.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsBlocksInfoOpen(false)}
              className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
