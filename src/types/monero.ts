export interface MoneroInfo {
  asset: {
    id: string;
    symbol: string;
    name: string;
    hashingAlgorithm: string;
    blockTimeMinutes: number;
    genesisDate: string;
    marketCapRank: number;
    image: {
      thumb: string;
      small: string;
      large: string;
    };
    links: {
      homepage: string;
      subreddit: string;
      github: string;
    };
  };
  market: {
    priceUsd: number;
    totalVolumeUsd: number;
    marketCapUsd: number;
    low24hUsd: number;
    high24hUsd: number;
    priceChange24hUsd: number;
    priceChange24hPct: number;
    priceChange7dPct: number;
    priceChange30dPct: number;
    priceChange1yPct: number;
    marketCapChange24hUsd: number;
    marketCapChange24hPct: number;
    athUsd: number;
    athChangePct: number;
    atlUsd: number;
    atlChangePct: number;
  };
  supply: {
    circulating: number;
    total: number;
    max: number | null;
    maxSupplyInfinite: boolean;
  };
  sentiment: {
    upVotesPct: number;
    downVotesPct: number;
    watchlistUsers: number;
  };
  source: string;
  sourceUpdatedAt: string;
  updatedAt: number;
}

export interface MoneroBlocksRange {
  startHeight: number;
  latestHeight: number;
  count: number;
}

export interface MoneroBlock {
  height: number;
  timestamp: number;
  difficulty: number;
  reward: number;
  numTxes: number;
  hash: string;
  orphanStatus: boolean;
  depth: number;
  cumulativeDifficulty: number;
}

export interface MoneroBlocks {
  range: MoneroBlocksRange;
  blocks: MoneroBlock[];
  node: string;
  updatedAt: number;
}

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
  blocks: MoneroBlocks | null;
  info: MoneroInfo | null;
  updatedAt: number;
}
