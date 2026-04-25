import Link from "next/link";
import type { ExplorerBlockDetail } from "@/types/explorer";

interface BlockDetailDashboardProps {
  block: ExplorerBlockDetail;
}

function formatRewardXmr(atomicUnits: number): string {
  return `${(atomicUnits / 1_000_000_000_000).toFixed(4)} XMR`;
}

function formatRewardUsd(value: number | null): string {
  if (!value || !Number.isFinite(value) || value <= 0) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes.toLocaleString()} B`;
  }

  return `${(bytes / 1024).toFixed(2)} KB`;
}

function formatFinderLabel(finder: string | null): string {
  return finder ?? "UNKNOWN";
}

function formatTimestampUtc(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "UTC",
  }).format(new Date(timestamp * 1000));
}

function getBlockObserverUrl(hash: string): string {
  return `https://blocks.p2pool.observer/block/${hash}`;
}

function getTransactionObserverUrl(hash: string): string {
  return `https://blocks.p2pool.observer/tx/${hash}`;
}

function HashRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <>
      <p className="tracking-widest text-zinc-400">{label}:</p>
      <div className="flex flex-col gap-1 sm:items-end">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="break-all text-zinc-300 hover:text-accent-monero transition-colors"
          >
            {value}
          </a>
        ) : (
          <p className="break-all text-zinc-300">{value}</p>
        )}
      </div>
    </>
  );
}

export function BlockDetailDashboard({ block }: BlockDetailDashboardProps) {
  return (
    <div className="grid gap-2 font-mono text-xs tracking-tighter text-white sm:gap-4 sm:text-sm">
      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="tracking-widest text-zinc-400">BLOCK SUMMARY</p>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[16ch_1fr]">
          <p className="tracking-widest text-zinc-400">HEIGHT:</p>
          <p className="text-right text-accent-monero">
            {block.height.toLocaleString()}
          </p>

          <p className="tracking-widest text-zinc-400">SOLVER:</p>
          <p className="text-right">{formatFinderLabel(block.finder)}</p>

          <p className="tracking-widest text-zinc-400">SIZE:</p>
          <p className="text-right">
            {block.blockWeight.toLocaleString()} bytes (
            {formatSize(block.blockWeight)})
          </p>

          <p className="tracking-widest text-zinc-400">REWARD:</p>
          <p className="text-right">
            {formatRewardXmr(block.reward)} / {formatRewardUsd(block.rewardUsd)}
          </p>

          <p className="tracking-widest text-zinc-400">TX COUNT:</p>
          <p className="text-right">{block.txCount.toLocaleString()}</p>

          <p className="tracking-widest text-zinc-400">TIMESTAMP:</p>
          <p className="text-right">{formatTimestampUtc(block.timestamp)}</p>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:gap-4">
        <div className="border border-white/10 rounded-none p-2 sm:p-4">
          <p className="mb-2 tracking-widest text-zinc-400">IDENTIFIERS</p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[16ch_1fr]">
            <HashRow label="BLOCK_ID" value={block.hash} />

            <HashRow label="PREV_BLOCK_ID" value={block.prevHash} />

            <p className="tracking-widest text-zinc-400">NONCE:</p>
            <p className="text-right text-zinc-300">
              {block.nonce.toLocaleString()}
            </p>

            <p className="tracking-widest text-zinc-400">DIFFICULTY:</p>
            <p className="text-right text-zinc-300">
              {block.difficulty.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border border-white/10 rounded-none p-2 sm:p-4">
          <p className="mb-2 tracking-widest text-zinc-400">EXPLORER LINKS</p>
          <div className="space-y-2 text-zinc-300">
            <a
              href={getBlockObserverUrl(block.hash)}
              target="_blank"
              rel="noreferrer"
              className="block border border-white/10 px-2 py-2 hover:border-accent-monero hover:text-accent-monero transition-colors"
            >
              OPEN BLOCK ON P2POOL OBSERVER
            </a>

            <Link
              href="/blocks"
              className="block border border-white/10 px-2 py-2 hover:border-accent-monero hover:text-accent-monero transition-colors"
            >
              BACK TO BLOCK LIST
            </Link>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 tracking-widest text-zinc-400">MINER TX</p>
            {block.minerTxHash ? (
              <a
                href={getTransactionObserverUrl(block.minerTxHash)}
                target="_blank"
                rel="noreferrer"
                className="break-all text-zinc-300 hover:text-accent-monero transition-colors"
              >
                {block.minerTxHash}
              </a>
            ) : (
              <p className="text-zinc-500">N/A</p>
            )}
          </div>
        </div>
      </section>

      <section className="border border-white/10 rounded-none p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="tracking-widest text-zinc-400">INCLUDED TRANSACTIONS</p>
          <p className="text-zinc-500">{block.txCount.toLocaleString()} TXS</p>
        </div>

        {block.txHashes.length > 0 ? (
          <div className="space-y-2">
            {block.txHashes.map((hash) => (
              <a
                key={hash}
                href={getTransactionObserverUrl(hash)}
                target="_blank"
                rel="noreferrer"
                className="block border border-white/10 px-2 py-2 hover:border-accent-monero hover:text-accent-monero transition-colors"
              >
                <span className="break-all text-zinc-300">{hash}</span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">
            No transaction hashes are cached for this block yet.
          </p>
        )}
      </section>
    </div>
  );
}
