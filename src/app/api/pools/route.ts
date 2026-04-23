import { NextResponse } from 'next/server';

type PoolItem = {
  name: string;
  homeUrl?: string;
  apiUrl?: string;
  hashrate: number;
  status: string;
};

type PoolsResponse = {
  pools: PoolItem[];
  network: { height: number; hashrate: number; difficulty: number };
  updatedAt: number;
};

export async function GET(): Promise<Response> {
  const data: PoolsResponse = {
    pools: [
      {
        name: "SupportXMR",
        homeUrl: "https://www.supportxmr.com",
        apiUrl: "https://www.supportxmr.com/api/pool/stats",
        hashrate: 1886993222,
        status: "online",
      },
      { name: "NanoPool", homeUrl: "https://xmr.nanopool.org/", apiUrl: "https://api.nanopool.org/v1/xmr/pool/hashrate", hashrate: 1204148610, status: "online" },
      { name: "P2Pool", homeUrl: "https://p2pool.io", apiUrl: "https://p2pool.io/api/pool/stats", hashrate: 329556506, status: "online" },
      { name: "Hashvault", homeUrl: "https://hashvault.pro/monero/", apiUrl: "https://api.hashvault.pro/v3/monero", hashrate: 724209699, status: "online" },
      { name: "MoneroOcean", homeUrl: "https://moneroocean.stream", apiUrl: "https://api.moneroocean.stream/pool/stats", hashrate: 196265494, status: "online" },
    ],
    network: { height: 3658998, hashrate: 5509801013, difficulty: 661176121502 },
    updatedAt: Date.now(),
  };

  return NextResponse.json(data, { status: 200 });
}
