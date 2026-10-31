-- Jumby Database Schema (Cloudflare D1 / SQLite)

-- 1. Games Table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  parent_game_id TEXT, -- If remixed, points to parent game
  engine TEXT DEFAULT 'canvas2d', -- 'canvas2d', 'kaplay', 'littlejs'
  current_version INTEGER DEFAULT 1,
  r2_bundle_path TEXT NOT NULL, -- games/:id/v1/index.html
  thumbnail_url TEXT,
  plays INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  remixes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Game Versions Table (Immutable commit log)
CREATE TABLE IF NOT EXISTS game_versions (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  prompt TEXT,
  r2_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 3. Player Cloud Saves Table (Game Memory)
CREATE TABLE IF NOT EXISTS player_saves (
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  state_json TEXT NOT NULL DEFAULT '{}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id)
);

-- 4. User Drafts Table (Work-in-progress state for studio resumption)
CREATE TABLE IF NOT EXISTS user_drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'Untitled Draft',
  prompt TEXT,
  r2_snapshot_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid feed queries
CREATE INDEX IF NOT EXISTS idx_games_plays ON games(plays DESC);
CREATE INDEX IF NOT EXISTS idx_games_likes ON games(likes DESC);
CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_parent ON games(parent_game_id);
