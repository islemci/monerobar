// Server component for Pools page; uses PoolsOverview (client) via prop data

import Link from "next/link";
import { TuiContainer } from "@/components/tui/tui-container";
import { Footer } from "@/components/footer";
import type { PoolsApiResponse } from "@/types/pools";
import { PoolsOverview } from "@/components/pools-dashboard";
import { PoolsList } from "@/components/pools-list";
import { getPoolsData, DEFAULT_POOLS_PAYLOAD } from "@/actions/get-pools-data";

// The actual data fetch is performed server-side in this repo's pattern,
// but to keep the UI snappy, we render a client component that expects data.
// For simplicity, this page fetches on the client using a small effect wrapper
// if an API route is available. Otherwise, it shows a placeholder.

import React from "react";

async function fetchPoolsOnServer(): Promise<PoolsApiResponse | undefined> {
  try {
    const res = await fetch("/api/pools", { cache: "no-store" });
    if (!res.ok) return undefined;
    const data = (await res.json()) as PoolsApiResponse;
    return data;
  } catch {
    return undefined;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "monero.bar | Pools Explorer",
    description:
      "Explore pool distribution and hash rates across mining pools with a consistent UI.",
  };
}

export default async function PoolsPage() {
  const initialData = await getPoolsData();

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-primary sm:px-6 sm:py-4">
      <TuiContainer>
        <div className="mb-2 sm:mb-4 flex flex-col gap-2 border border-white/10 rounded-none p-2 sm:p-3 sm:flex-row sm:items-start sm:justify-between">
          <header className="font-mono text-xs sm:text-sm tracking-widest text-white text-left">
            <Link href="/">
              <span className="bg-gradient-to-r from-accent-monero via-amber-300 to-[#fff1cc] bg-clip-text text-transparent">[ MONERO.BAR ]</span>
            </Link>
            <span className="text-zinc-400 ml-2">/ POOLS</span>
          </header>
          <Footer />
        </div>

        {/* Pools List: sorted by hashrate (SSR) */}
        <section className="border border-white/10 rounded-none p-2 sm:p-4">
          <PoolsList data={initialData ?? DEFAULT_POOLS_PAYLOAD} />
        </section>
      </TuiContainer>
    </main>
  );
}
