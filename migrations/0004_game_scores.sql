-- Migration 0004: Game Scores & Leaderboards Table
-- High-throughput, conflict-free personal best tracking per (user, game)

CREATE TABLE IF NOT EXISTS game_scores (
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, game_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game ON game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
