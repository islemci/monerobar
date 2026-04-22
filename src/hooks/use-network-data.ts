"use client";

import { useQuery } from "@tanstack/react-query";
import type { MoneroStats } from "@/types/monero";

const BACKEND_REFRESH_MS = 120_000;
const FAST_POLL_MS = 2_000;
const FALLBACK_POLL_MS = 20_000;

async function fetchNetworkData(): Promise<MoneroStats> {
    const response = await fetch("/api/status", {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

        throw new Error(
            payload?.error ?? "[!] SYSTEM_OFFLINE: UNABLE TO REACH AGGREGATOR.",
        );
    }

    return (await response.json()) as MoneroStats;
}

export function useNetworkData(initialData?: MoneroStats) {
    return useQuery({
        queryKey: ["network-data"],
        queryFn: fetchNetworkData,
        initialData,
        refetchInterval: (query) => {
            const data = query.state.data as MoneroStats | undefined;

            if (!data?.updatedAt) {
                return FALLBACK_POLL_MS;
            }

            const ageMs = Math.max(0, Date.now() - data.updatedAt);
            const remainingMs = BACKEND_REFRESH_MS - ageMs;

            // Poll quickly once we're near/after the expected backend refresh boundary.
            return remainingMs > FAST_POLL_MS ? remainingMs : FAST_POLL_MS;
        },
        refetchOnWindowFocus: true,
    });
}
