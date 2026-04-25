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
