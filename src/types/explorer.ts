export interface ExplorerBlockHeader {
  height: number;
  timestamp: number;
  difficulty: number;
  reward: number;
  numTxes: number;
  hash: string;
  orphanStatus: boolean;
  depth: number;
  cumulativeDifficulty: number;
  blockWeight: number;
  prevHash: string;
  nonce: number;
}

export interface ExplorerBlock {
  height: number;
  hash: string;
  finder: string | null;
  timestamp: number;
  difficulty: number;
  reward: number;
  txCount: number;
  blockWeight: number;
  prevHash: string;
  nonce: number;
  header: ExplorerBlockHeader;
}

export interface ExplorerRange {
  startHeight: number;
  latestHeight: number;
  count: number;
}

export interface ExplorerData {
  range: ExplorerRange;
  node: string;
  blocks: ExplorerBlock[];
  collectedTxCount: number;
  mode: string;
  updatedAt: number;
}

export interface ExplorerBlockDetail {
  requestedId: string;
  height: number;
  hash: string;
  prevHash: string;
  timestamp: number;
  difficulty: number;
  reward: number;
  rewardUsd: number | null;
  txCount: number;
  txHashes: string[];
  minerTxHash: string | null;
  finder: string | null;
  blockWeight: number;
  nonce: number;
  sourceNode: string;
  updatedAt: number;
}
