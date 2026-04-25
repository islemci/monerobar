"use server";

import Redis from "ioredis";
import type {
  ExplorerBlock,
  ExplorerBlockDetail,
  ExplorerData,
} from "@/types/explorer";

type ExplorerBlockDetailRecord = {
  height?: number;
  hash?: string | null;
  prevHash?: string | null;
  timestamp?: number | null;
  difficulty?: number | null;
  reward?: number | null;
  blockWeight?: number | null;
  nonce?: number | null;
  txCount?: number;
  txHashes?: string[];
  minerTxHash?: string | null;
  finder?: string | null;
  sourceNode?: string | null;
  updatedAt?: number;
};

type MoneroInfoPayload = {
  market?: {
    priceUsd?: number | null;
  };
};

type MoneroBlockJson = {
  prev_id?: string;
  tx_hashes?: string[];
};

type MoneroGetBlockResult = {
  block_header?: {
    hash?: string;
    height?: number;
    prev_hash?: string;
    timestamp?: number;
    difficulty?: number;
    reward?: number;
    block_weight?: number;
    nonce?: number;
    num_txes?: number;
  };
  json?: string;
  miner_tx_hash?: string;
  tx_hashes?: string[];
};

const MONERO_DAEMON_JSON_RPC_URL = "http://monero.mullvad.net:18081/json_rpc";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error(
        "REDIS_URL environment variable is not set. Provide a Redis connection URL.",
      );
    }

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
    });
  }

  return redisClient;
}

function asNumber(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function parseExplorerBlock(block: unknown): ExplorerBlock {
  const value = (block ?? {}) as Partial<ExplorerBlock>;

  return {
    height: asNumber(value.height),
    hash: String(value.hash ?? ""),
    finder: asNullableString(value.finder),
    timestamp: asNumber(value.timestamp),
    difficulty: asNumber(value.difficulty),
    reward: asNumber(value.reward),
    txCount: Math.max(0, asNumber(value.txCount ?? value.header?.numTxes)),
    blockWeight: Math.max(
      0,
      asNumber(value.blockWeight ?? value.header?.blockWeight),
    ),
    prevHash: String(value.prevHash ?? value.header?.prevHash ?? ""),
    nonce: asNumber(value.nonce ?? value.header?.nonce),
    header: {
      height: asNumber(value.header?.height ?? value.height),
      timestamp: asNumber(value.header?.timestamp ?? value.timestamp),
      difficulty: asNumber(value.header?.difficulty ?? value.difficulty),
      reward: asNumber(value.header?.reward ?? value.reward),
      numTxes: Math.max(0, asNumber(value.header?.numTxes ?? value.txCount)),
      hash: String(value.header?.hash ?? value.hash ?? ""),
      orphanStatus: Boolean(value.header?.orphanStatus),
      depth: Math.max(0, asNumber(value.header?.depth)),
      cumulativeDifficulty: asNumber(value.header?.cumulativeDifficulty),
      blockWeight: Math.max(
        0,
        asNumber(value.header?.blockWeight ?? value.blockWeight),
      ),
      prevHash: String(value.header?.prevHash ?? value.prevHash ?? ""),
      nonce: asNumber(value.header?.nonce ?? value.nonce),
    },
  };
}

function parseExplorerPayload(payload: unknown): ExplorerData | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Partial<ExplorerData>;

  return {
    range: {
      startHeight: asNumber(value.range?.startHeight),
      latestHeight: asNumber(value.range?.latestHeight),
      count: Math.max(0, asNumber(value.range?.count)),
    },
    node: String(value.node ?? ""),
    blocks: Array.isArray(value.blocks)
      ? value.blocks.map((block) => parseExplorerBlock(block))
      : [],
    collectedTxCount: asNumber(value.collectedTxCount),
    mode: String(value.mode ?? "headers-only"),
    updatedAt: asNumber(value.updatedAt, Date.now()),
  };
}

function parseExplorerBlockDetail(
  payload: unknown,
): ExplorerBlockDetailRecord | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as ExplorerBlockDetailRecord;

  return {
    height: asNumber(value.height),
    hash: asNullableString(value.hash),
    prevHash: asNullableString(value.prevHash),
    timestamp: asNumber(value.timestamp),
    difficulty: asNumber(value.difficulty),
    reward: asNumber(value.reward),
    blockWeight: asNumber(value.blockWeight),
    nonce: asNumber(value.nonce),
    txCount: Math.max(0, asNumber(value.txCount)),
    txHashes: asStringArray(value.txHashes),
    minerTxHash: asNullableString(value.minerTxHash),
    finder: asNullableString(value.finder),
    sourceNode: asNullableString(value.sourceNode),
    updatedAt: asNumber(value.updatedAt, Date.now()),
  };
}

function parsePriceUsd(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const priceUsd = (payload as MoneroInfoPayload).market?.priceUsd;
  return Number.isFinite(priceUsd) ? Number(priceUsd) : null;
}

function normalizeBlockHash(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function fetchLiveBlockDetailByHeight(
  height: number,
): Promise<ExplorerBlockDetailRecord | null> {
  try {
    const response = await fetch(MONERO_DAEMON_JSON_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "get_block",
        params: {
          height,
        },
      }),
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: MoneroGetBlockResult;
    };

    const result = payload.result;
    const header = result?.block_header;
    const blockJson = parseJson<MoneroBlockJson>(result?.json ?? null);
    const txHashes = uniqueStrings([
      ...asStringArray(result?.tx_hashes),
      ...asStringArray(blockJson?.tx_hashes),
    ]);

    return {
      height: asNumber(header?.height, height),
      hash: asNullableString(header?.hash),
      prevHash: asNullableString(blockJson?.prev_id ?? header?.prev_hash),
      timestamp: asNumber(header?.timestamp),
      difficulty: asNumber(header?.difficulty),
      reward: asNumber(header?.reward),
      blockWeight: asNumber(header?.block_weight),
      nonce: asNumber(header?.nonce),
      txCount: Math.max(0, asNumber(header?.num_txes, txHashes.length)),
      txHashes,
      minerTxHash: asNullableString(result?.miner_tx_hash),
      finder: null,
      sourceNode: "Mullvad",
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function getBlockDetail(
  blockId: string,
): Promise<ExplorerBlockDetail | null> {
  const redis = getRedisClient();
  const requestedId = blockId.trim();

  if (!requestedId) {
    return null;
  }

  const isHeightLookup = /^\d+$/.test(requestedId);
  const hashLookup = /^[0-9a-f]{64}$/i.test(requestedId)
    ? normalizeBlockHash(requestedId)
    : null;

  let resolvedHeight = isHeightLookup ? Number.parseInt(requestedId, 10) : null;

  const [rawExplorer, rawInfo, rawHashAlias] = await Promise.all([
    redis.get("monero:explorer"),
    redis.get("monero:info"),
    hashLookup ? redis.get(`monero:block-detail-hash:${hashLookup}`) : null,
  ]);

  if (resolvedHeight === null && rawHashAlias) {
    const nextHeight = Number(rawHashAlias);
    resolvedHeight = Number.isFinite(nextHeight) ? nextHeight : null;
  }

  const explorer = parseExplorerPayload(parseJson<ExplorerData>(rawExplorer));

  let explorerBlock =
    resolvedHeight !== null
      ? (explorer?.blocks.find((block) => block.height === resolvedHeight) ??
        null)
      : null;

  if (!explorerBlock && hashLookup) {
    explorerBlock =
      explorer?.blocks.find(
        (block) => normalizeBlockHash(block.hash) === hashLookup,
      ) ?? null;
    resolvedHeight ??= explorerBlock?.height ?? null;
  }

  if (resolvedHeight === null) {
    return null;
  }

  const rawDetail = await redis.get(`monero:block-detail:${resolvedHeight}`);
  let detail = parseExplorerBlockDetail(
    parseJson<ExplorerBlockDetailRecord>(rawDetail),
  );

  if (
    (!detail || ((detail.txHashes?.length ?? 0) === 0 && (detail.txCount ?? 0) > 0)) &&
    resolvedHeight !== null
  ) {
    const liveDetail = await fetchLiveBlockDetailByHeight(resolvedHeight);

    if (liveDetail) {
      detail = {
        ...detail,
        ...liveDetail,
        finder: detail?.finder ?? explorerBlock?.finder ?? liveDetail.finder,
      };

      const pipeline = redis.pipeline();
      pipeline.set(`monero:block-detail:${resolvedHeight}`, JSON.stringify(detail));

      if (detail.hash) {
        pipeline.set(
          `monero:block-detail-hash:${normalizeBlockHash(detail.hash)}`,
          String(resolvedHeight),
        );
      }

      await pipeline.exec();
    }
  }

  if (!detail && !explorerBlock) {
    return null;
  }

  const priceUsd = parsePriceUsd(parseJson<MoneroInfoPayload>(rawInfo));
  const rewardAtomic = detail?.reward ?? explorerBlock?.reward ?? 0;
  const rewardUsd =
    priceUsd && rewardAtomic > 0
      ? (rewardAtomic / 1_000_000_000_000) * priceUsd
      : null;

  return {
    requestedId,
    height: detail?.height ?? explorerBlock?.height ?? resolvedHeight,
    hash: detail?.hash ?? explorerBlock?.hash ?? hashLookup ?? "",
    prevHash:
      detail?.prevHash ??
      explorerBlock?.prevHash ??
      explorerBlock?.header.prevHash ??
      "",
    timestamp:
      detail?.timestamp ??
      explorerBlock?.timestamp ??
      explorerBlock?.header.timestamp ??
      0,
    difficulty:
      detail?.difficulty ??
      explorerBlock?.difficulty ??
      explorerBlock?.header.difficulty ??
      0,
    reward: rewardAtomic,
    rewardUsd,
    txCount: detail?.txCount ?? explorerBlock?.txCount ?? 0,
    txHashes: detail?.txHashes ?? [],
    minerTxHash: detail?.minerTxHash ?? null,
    finder: detail?.finder ?? explorerBlock?.finder ?? null,
    blockWeight:
      detail?.blockWeight ??
      explorerBlock?.blockWeight ??
      explorerBlock?.header.blockWeight ??
      0,
    nonce:
      detail?.nonce ?? explorerBlock?.nonce ?? explorerBlock?.header.nonce ?? 0,
    sourceNode: detail?.sourceNode ?? explorer?.node ?? "Mullvad",
    updatedAt: detail?.updatedAt ?? explorer?.updatedAt ?? Date.now(),
  };
}
