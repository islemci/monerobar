export interface MoneroStats {
  network: { height: number; hashrate: number; difficulty: number };
  nodes: Array<{
    name: string;
    url: string;
    status: string;
    pingMs: number;
    height: number;
    difficulty: number;
  }>;
  pools: Array<{
    name: string;
    homeUrl: string;
    apiUrl: string;
    hashrate: number;
    status: string;
  }>;
  updatedAt: number;
}
