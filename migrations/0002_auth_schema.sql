-- Jumby Auth Schema (Cloudflare D1 / SQLite)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                 -- usr_... or usr_anon_...
  email TEXT UNIQUE,                   -- NULL for anonymous guests
  username TEXT UNIQUE NOT NULL,       -- e.g. @pixelninja
  display_name TEXT NOT NULL,          -- e.g. "Pixel Ninja"
  avatar_url TEXT,
  password_hash TEXT,                  -- PBKDF2 salt:hash (NULL for guests)
  is_guest INTEGER DEFAULT 0,          -- 1 for guest, 0 for permanent
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions Table (Multi-device tracking & fast edge revocation)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                 -- Cryptographic session token
  user_id TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
