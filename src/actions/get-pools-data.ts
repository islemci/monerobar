import type { PoolsApiResponse, PoolApiItem } from "@/types/pools";
import redis from "@/lib/redis";

// Server-side data fetch for pools. Assumes an API endpoint that returns PoolsApiResponse.
const SAMPLE_POOLS: PoolApiItem[] = [
  { name: "SupportXMR", homeUrl: "https://www.supportxmr.com", apiUrl: "https://www.supportxmr.com/api/pool/stats", hashrate: 1886993222, status: "online" },
  { name: "NanoPool", homeUrl: "https://xmr.nanopool.org/", apiUrl: "https://api.nanopool.org/v1/xmr/pool/hashrate", hashrate: 1204148610, status: "online" },
  { name: "P2Pool", homeUrl: "https://p2pool.io", apiUrl: "https://p2pool.io/api/pool/stats", hashrate: 329556506, status: "online" },
  { name: "Hashvault", homeUrl: "https://hashvault.pro/monero/", apiUrl: "https://api.hashvault.pro/v3/monero", hashrate: 724209699, status: "online" },
  { name: "MoneroOcean", homeUrl: "https://moneroocean.stream", apiUrl: "https://api.moneroocean.stream/pool/stats", hashrate: 196265494, status: "online" },
];
const SAMPLE_NETWORK = { height: 3658998, hashrate: 5509801013, difficulty: 661176121502 };
const SAMPLE_PAYLOAD: PoolsApiResponse = {
  pools: SAMPLE_POOLS,
  network: SAMPLE_NETWORK,
  updatedAt: Date.now(),
};
export const DEFAULT_POOLS_PAYLOAD: PoolsApiResponse = SAMPLE_PAYLOAD;

export async function getPoolsData(): Promise<PoolsApiResponse> {
  // First, try to read from Redis (monero:stats)
  try {
    const raw = await (redis as any).get("monero:stats");
    if (raw) {
      const parsed = JSON.parse(raw) as any;
      if (parsed && Array.isArray(parsed.pools)) {
        const pools = (parsed.pools as any[]).map((p) => ({
          name: String(p.name ?? ""),
          homeUrl: p.homeUrl ?? undefined,
          apiUrl: p.apiUrl ?? undefined,
          hashrate: Number(p.hashrate ?? 0),
          status: String(p.status ?? "offline"),
        })) as PoolApiItem[];

        const network = parsed.network ?? {
          height: Number(parsed.height ?? 0),
          hashrate: Number(parsed.hashrate ?? 0),
          difficulty: Number(parsed.difficulty ?? 0),
        };

        const updatedAt = Number(parsed.updatedAt ?? Date.now());
        return { pools, network, updatedAt } as PoolsApiResponse;
      }
    }
  } catch {
    // ignore and fall back to sample data
  }

  // Fallback to sample payload if Redis fetch fails or data is invalid
  return SAMPLE_PAYLOAD;
}
