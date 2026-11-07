export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface GameStats {
  plays: number;
  likes: number;
  remixes: number;
  highScore?: number;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  creator: Creator;
  parentGameId?: string | null;
  parentGameTitle?: string | null;
  engine: 'canvas2d' | 'kaplay' | 'littlejs';
  bundleUrl: string; // URL to the game's index.html
  thumbnailUrl?: string;
  stats: GameStats;
  tags: string[];
  controlsHint: string;
  createdAt: string;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorCta?: string;
  sponsorUrl?: string;
}

// Sandbox postMessage Protocol
export type JumbyMessageType =
  | 'JUMBY_READY'
  | 'JUMBY_SCORE_UPDATE'
  | 'JUMBY_GAME_OVER'
  | 'JUMBY_AWARD_COINS'
  | 'JUMBY_STORAGE_GET'
  | 'JUMBY_STORAGE_SET'
  | 'JUMBY_STORAGE_RESPONSE'
  | 'JUMBY_BUY_ITEM'
  | 'JUMBY_BUY_RESPONSE'
  | 'JUMBY_SHOW_REWARDED_AD'
  | 'JUMBY_AD_RESPONSE'
  | 'JUMBY_PAUSE'
  | 'JUMBY_RESUME';
