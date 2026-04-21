"use server";

import { Redis } from "@upstash/redis";
import type { MoneroInfo, MoneroStats } from "@/types/monero";

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

export async function getNetworkStats(): Promise<MoneroStats> {
    const redis = Redis.fromEnv();
    const [rawStats, rawInfo] = await Promise.all([
        redis.get<unknown>("monero:stats"),
        redis.get<unknown>("monero:info"),
    ]);

    if (!rawStats) {
        throw new Error("monero:stats key is missing");
    }

    const statsPayload =
        typeof rawStats === "string" ? JSON.parse(rawStats) : rawStats;
    const stats = parsePayload(statsPayload);

    if (!rawInfo) {
        return stats;
    }

    try {
        const infoPayload =
            typeof rawInfo === "string" ? JSON.parse(rawInfo) : rawInfo;
        return {
            ...stats,
            info: parseInfoPayload(infoPayload),
        };
    } catch {
        return stats;
    }
}
