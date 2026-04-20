"use client";

import { useQuery } from "@tanstack/react-query";
import type { MoneroStats } from "@/types/monero";

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
        refetchInterval: 10_000,
        refetchOnWindowFocus: true,
    });
}
