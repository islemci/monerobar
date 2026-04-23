"use client";

import React, { useEffect, useState } from "react";
import type { PoolsApiResponse } from "@/types/pools";
import { PoolsOverview } from "@/components/pools-dashboard";

export function PoolsClientWrapper() {
  const [data, setData] = useState<PoolsApiResponse | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pools", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as PoolsApiResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load pool data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm tracking-tighter text-white">
          [ LOADING_POOLS... ]
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono text-sm tracking-tighter text-status-offline">
          [!] FAILED_TO_LOAD_POOLS
        </p>
      </div>
    );
  }

  return <PoolsOverview data={data} />;
}
