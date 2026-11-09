import fs from 'fs';
import path from 'path';

// Read seed-games.ts and strip TypeScript type annotations and export
const seedFilePath = path.resolve('src/data/seed-games.ts');
let code = fs.readFileSync(seedFilePath, 'utf-8');

// Strip TypeScript import, export, and type annotations
code = code.replace(/import\s+.*?;/g, '');
code = code.replace(/export\s+const\s+SEED_GAMES/g, 'const SEED_GAMES');
code = code.replace(/:\s*Game\[\]/g, '');

// Evaluate SEED_GAMES
const evaluated = new Function(code + '\nreturn SEED_GAMES;')();

console.log(`Found ${evaluated.length} seed games.`);

// Create SQL statements
const users = new Map();
const gameSqlStatements = [];

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

for (const game of evaluated) {
  // Collect creator user
  if (game.creator && !users.has(game.creator.id)) {
    users.set(game.creator.id, {
      id: game.creator.id,
      username: game.creator.username || game.creator.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      displayName: game.creator.name,
      avatarUrl: game.creator.avatar,
    });
  }

  const r2Path = `games/${game.slug}/index.html`;

  gameSqlStatements.push(`
INSERT OR IGNORE INTO games (
  id, slug, title, description, prompt,
  creator_id, creator_name, creator_avatar,
  parent_game_id, engine, current_version,
  r2_bundle_path, plays, likes, remixes, created_at
) VALUES (
  ${escapeSql(game.id)},
  ${escapeSql(game.slug)},
  ${escapeSql(game.title)},
  ${escapeSql(game.description)},
  ${escapeSql(game.prompt)},
  ${escapeSql(game.creator.id)},
  ${escapeSql(game.creator.name)},
  ${escapeSql(game.creator.avatar)},
  ${escapeSql(game.parentGameId)},
  ${escapeSql(game.engine || 'canvas2d')},
  1,
  ${escapeSql(r2Path)},
  ${game.stats?.plays || 0},
  ${game.stats?.likes || 0},
  ${game.stats?.remixes || 0},
  ${escapeSql(game.createdAt || new Date().toISOString())}
);`);
}

const userSqlStatements = Array.from(users.values()).map((user) => `
INSERT OR IGNORE INTO users (
  id, email, username, display_name, avatar_url, is_guest
) VALUES (
  ${escapeSql(user.id)},
  NULL,
  ${escapeSql(user.username)},
  ${escapeSql(user.displayName)},
  ${escapeSql(user.avatarUrl)},
  0
);`);

const fullMigrationSql = `-- Migration 0003: Seed Games and Creators
-- Auto-generated from src/data/seed-games.ts

-- 1. Seed Creators
${userSqlStatements.join('\n')}

-- 2. Seed Games
${gameSqlStatements.join('\n')}
`;

const outputPath = path.resolve('migrations/0003_seed_games.sql');
fs.writeFileSync(outputPath, fullMigrationSql, 'utf-8');
console.log(`Generated migration: ${outputPath}`);
