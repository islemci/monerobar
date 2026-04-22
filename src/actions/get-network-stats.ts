"use server";

import Redis from "ioredis";
import type { MoneroBlocks, MoneroInfo, MoneroStats } from "@/types/monero";

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

function asNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const next = Number(value);
    return Number.isFinite(next) ? next : null;
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

function parsePayload(payload: unknown): MoneroStats {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid monero:stats payload");
    }

    const value = payload as Partial<MoneroStats>;

    return {
        network: {
            height: asNumber(value.network?.height),
            hashrate: asNumber(value.network?.hashrate),
            difficulty: asNumber(value.network?.difficulty),
        },
        nodes: Array.isArray(value.nodes)
            ? value.nodes.map((node) => ({
                name: String(node?.name ?? "UNKNOWN"),
                url: String(node?.url ?? ""),
                status: String(node?.status ?? "offline"),
                pingMs: Math.max(0, asNumber(node?.pingMs)),
                height: asNumber(node?.height),
                difficulty: asNumber(node?.difficulty),
            }))
            : [],
        pools: Array.isArray(value.pools)
            ? value.pools.map((pool) => ({
                name: String(pool?.name ?? "UNKNOWN"),
                homeUrl: String(pool?.homeUrl ?? ""),
                apiUrl: String(pool?.apiUrl ?? ""),
                hashrate: Math.max(0, asNumber(pool?.hashrate)),
                status: String(pool?.status ?? "unknown"),
            }))
            : [],
        blocks: null,
        info: null,
        updatedAt: asNumber(value.updatedAt, Date.now()),
    };
}

function parseInfoPayload(payload: unknown): MoneroInfo {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid monero:info payload");
    }

    const value = payload as Partial<MoneroInfo>;

    return {
        asset: {
            id: String(value.asset?.id ?? "monero"),
            symbol: String(value.asset?.symbol ?? "xmr"),
            name: String(value.asset?.name ?? "Monero"),
            hashingAlgorithm: String(value.asset?.hashingAlgorithm ?? ""),
            blockTimeMinutes: asNumber(value.asset?.blockTimeMinutes),
            genesisDate: String(value.asset?.genesisDate ?? ""),
            marketCapRank: asNumber(value.asset?.marketCapRank),
            image: {
                thumb: String(value.asset?.image?.thumb ?? ""),
                small: String(value.asset?.image?.small ?? ""),
                large: String(value.asset?.image?.large ?? ""),
            },
            links: {
                homepage: String(value.asset?.links?.homepage ?? ""),
                subreddit: String(value.asset?.links?.subreddit ?? ""),
                github: String(value.asset?.links?.github ?? ""),
            },
        },
        market: {
            priceUsd: asNumber(value.market?.priceUsd),
            totalVolumeUsd: asNumber(value.market?.totalVolumeUsd),
            marketCapUsd: asNumber(value.market?.marketCapUsd),
            low24hUsd: asNumber(value.market?.low24hUsd),
            high24hUsd: asNumber(value.market?.high24hUsd),
            priceChange24hUsd: asNumber(value.market?.priceChange24hUsd),
            priceChange24hPct: asNumber(value.market?.priceChange24hPct),
            priceChange7dPct: asNumber(value.market?.priceChange7dPct),
            priceChange30dPct: asNumber(value.market?.priceChange30dPct),
            priceChange1yPct: asNumber(value.market?.priceChange1yPct),
            marketCapChange24hUsd: asNumber(value.market?.marketCapChange24hUsd),
            marketCapChange24hPct: asNumber(value.market?.marketCapChange24hPct),
            athUsd: asNumber(value.market?.athUsd),
            athChangePct: asNumber(value.market?.athChangePct),
            atlUsd: asNumber(value.market?.atlUsd),
            atlChangePct: asNumber(value.market?.atlChangePct),
        },
        supply: {
            circulating: asNumber(value.supply?.circulating),
            total: asNumber(value.supply?.total),
            max: asNullableNumber(value.supply?.max),
            maxSupplyInfinite: asBoolean(value.supply?.maxSupplyInfinite),
        },
        sentiment: {
            upVotesPct: asNumber(value.sentiment?.upVotesPct),
            downVotesPct: asNumber(value.sentiment?.downVotesPct),
            watchlistUsers: asNumber(value.sentiment?.watchlistUsers),
        },
        source: String(value.source ?? "unknown"),
        sourceUpdatedAt: String(value.sourceUpdatedAt ?? ""),
        updatedAt: asNumber(value.updatedAt, Date.now()),
    };
}

function parseBlocksPayload(payload: unknown): MoneroBlocks {
    if (!payload || typeof payload !== "object") {
        throw new Error("Invalid monero:blocks payload");
    }

    const value = payload as Partial<MoneroBlocks>;

    return {
        range: {
            startHeight: asNumber(value.range?.startHeight),
            latestHeight: asNumber(value.range?.latestHeight),
            count: Math.max(0, asNumber(value.range?.count)),
        },
        blocks: Array.isArray(value.blocks)
            ? value.blocks.map((block) => ({
                height: asNumber(block?.height),
                timestamp: asNumber(block?.timestamp),
                difficulty: asNumber(block?.difficulty),
                reward: asNumber(block?.reward),
                numTxes: Math.max(0, asNumber(block?.numTxes)),
                hash: String(block?.hash ?? ""),
                orphanStatus: asBoolean(block?.orphanStatus),
                depth: Math.max(0, asNumber(block?.depth)),
                cumulativeDifficulty: asNumber(block?.cumulativeDifficulty),
            }))
            : [],
        node: String(value.node ?? ""),
        updatedAt: asNumber(value.updatedAt, Date.now()),
    };
}

export async function getNetworkStats(): Promise<MoneroStats> {
    const redis = getRedisClient();
    const [rawStats, rawInfo, rawBlocks] = await Promise.all([
        redis.get("monero:stats"),
        redis.get("monero:info"),
        redis.get("monero:blocks"),
    ]);

    if (!rawStats) {
        throw new Error("monero:stats key is missing");
    }

    const statsPayload =
        typeof rawStats === "string" ? JSON.parse(rawStats) : rawStats;
    const stats = parsePayload(statsPayload);

    let blocks: MoneroBlocks | null = null;

    if (rawBlocks) {
        try {
            const blocksPayload =
                typeof rawBlocks === "string" ? JSON.parse(rawBlocks) : rawBlocks;
            blocks = parseBlocksPayload(blocksPayload);
        } catch {
            blocks = null;
        }
    }

    const statsWithBlocks: MoneroStats = {
        ...stats,
        blocks,
    };

    if (!rawInfo) {
        return statsWithBlocks;
    }

    try {
        const infoPayload =
            typeof rawInfo === "string" ? JSON.parse(rawInfo) : rawInfo;
        return {
            ...statsWithBlocks,
            info: parseInfoPayload(infoPayload),
        };
    } catch {
        return statsWithBlocks;
    }
}
