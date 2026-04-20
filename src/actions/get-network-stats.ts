"use server";

import { Redis } from "@upstash/redis";
import type { MoneroStats } from "@/types/monero";

function asNumber(value: unknown, fallback = 0): number {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
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
        updatedAt: asNumber(value.updatedAt, Date.now()),
    };
}

export async function getNetworkStats(): Promise<MoneroStats> {
    const redis = Redis.fromEnv();
    const raw = await redis.get<unknown>("monero:stats");

    if (!raw) {
        throw new Error("monero:stats key is missing");
    }

    const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsePayload(payload);
}
