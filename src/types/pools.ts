export type PoolApiItem = {
  name: string;
  homeUrl?: string;
  apiUrl?: string;
  hashrate: number;
  status: string;
};

export type PoolsApiResponse = {
  pools: PoolApiItem[];
  network?: {
    hashrate?: number;
    height?: number;
    difficulty?: number;
  };
  updatedAt?: number;
};
