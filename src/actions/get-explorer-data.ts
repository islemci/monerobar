"use server";

import Redis from "ioredis";
import type { ExplorerBlock, ExplorerData } from "@/types/explorer";

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

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseExplorerPayload(payload: unknown): ExplorerData {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid monero:explorer payload");
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
      ? value.blocks.map(
          (block): ExplorerBlock => ({
            height: asNumber(block?.height),
            hash: String(block?.hash ?? ""),
            finder: asNullableString(block?.finder),
            timestamp: asNumber(block?.timestamp),
            difficulty: asNumber(block?.difficulty),
            reward: asNumber(block?.reward),
            txCount: Math.max(
              0,
              asNumber(block?.txCount ?? block?.header?.numTxes),
            ),
            blockWeight: Math.max(
              0,
              asNumber(block?.blockWeight ?? block?.header?.blockWeight),
            ),
            prevHash: String(block?.prevHash ?? block?.header?.prevHash ?? ""),
            nonce: asNumber(block?.nonce ?? block?.header?.nonce),
            header: {
              height: asNumber(block?.header?.height ?? block?.height),
              timestamp: asNumber(block?.header?.timestamp ?? block?.timestamp),
              difficulty: asNumber(
                block?.header?.difficulty ?? block?.difficulty,
              ),
              reward: asNumber(block?.header?.reward ?? block?.reward),
              numTxes: Math.max(
                0,
                asNumber(block?.header?.numTxes ?? block?.txCount),
              ),
              hash: String(block?.header?.hash ?? block?.hash ?? ""),
              orphanStatus: asBoolean(block?.header?.orphanStatus),
              depth: Math.max(0, asNumber(block?.header?.depth)),
              cumulativeDifficulty: asNumber(
                block?.header?.cumulativeDifficulty,
              ),
              blockWeight: Math.max(
                0,
                asNumber(block?.header?.blockWeight ?? block?.blockWeight),
              ),
              prevHash: String(
                block?.header?.prevHash ?? block?.prevHash ?? "",
              ),
              nonce: asNumber(block?.header?.nonce ?? block?.nonce),
            },
          }),
        )
      : [],
    collectedTxCount: asNumber(value.collectedTxCount),
    mode: String(value.mode ?? "headers-only"),
    updatedAt: asNumber(value.updatedAt, Date.now()),
  };
}

export async function getExplorerData(): Promise<ExplorerData> {
  const redis = getRedisClient();
  const raw = await redis.get("monero:explorer");

  if (!raw) {
    throw new Error("monero:explorer key is missing");
  }

  const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
  return parseExplorerPayload(payload);
}
