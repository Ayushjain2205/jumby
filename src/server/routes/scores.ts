import { Hono } from 'hono';
import { CloudflareEnv, AppVariables } from '../types';

export const scoresRouter = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

// POST /api/scores/submit - Submit personal best (Technique 1)
scoresRouter.post('/submit', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  if (!db) {
    return c.json({ error: 'Database unavailable' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { gameId, score } = body;

  const numericScore = Math.floor(Number(score));
  if (!gameId || isNaN(numericScore) || numericScore <= 0) {
    return c.json({ error: 'Valid gameId and positive score required' }, 400);
  }

  try {
    // 1. Atomic conflict-guarded upsert: only overwrites if incoming score is higher
    const result = await db
      .prepare(`
        INSERT INTO game_scores (user_id, game_id, score, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, game_id) DO UPDATE SET
          score = excluded.score,
          updated_at = CURRENT_TIMESTAMP
        WHERE excluded.score > game_scores.score
      `)
      .bind(user.id, gameId, numericScore)
      .run();

    // 2. Increment plays counter on game record
    await db
      .prepare('UPDATE games SET plays = plays + 1 WHERE id = ? OR slug = ?')
      .bind(gameId, gameId)
      .run();

    return c.json({
      success: true,
      score: numericScore,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('[/api/scores/submit] Error:', err);
    return c.json({ error: 'Failed to record score' }, 500);
  }
});

// GET /api/scores/user - Get all personal bests for the current authenticated/guest user
scoresRouter.get('/user', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  if (!db) {
    return c.json({ scores: [] });
  }

  try {
    const rows = await db
      .prepare(`
        SELECT 
          s.game_id as gameId,
          s.score,
          s.updated_at as updatedAt,
          COALESCE(g.title, s.game_id) as title,
          COALESCE(g.slug, s.game_id) as slug,
          g.thumbnail_url as thumbnailUrl
        FROM game_scores s
        LEFT JOIN games g ON (s.game_id = g.id OR s.game_id = g.slug)
        WHERE s.user_id = ?
        ORDER BY s.score DESC
      `)
      .bind(user.id)
      .all<{
        gameId: string;
        score: number;
        updatedAt: string;
        title: string;
        slug: string;
        thumbnailUrl: string | null;
      }>();

    return c.json({ scores: rows.results || [] });
  } catch (err) {
    console.error('[/api/scores/user] Error:', err);
    return c.json({ scores: [] });
  }
});

// GET /api/scores/leaderboard/:gameId - Top 10 global leaderboard (edge cached)
scoresRouter.get('/leaderboard/:gameId', async (c) => {
  const gameId = c.req.param('gameId');
  const db = c.env.DB;

  if (!db) {
    return c.json({ leaderboard: [] });
  }

  try {
    const rows = await db
      .prepare(`
        SELECT 
          u.id as userId,
          u.username,
          u.display_name as displayName,
          u.avatar_url as avatarUrl,
          s.score,
          s.updated_at as updatedAt
        FROM game_scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.game_id = ?
        ORDER BY s.score DESC
        LIMIT 10
      `)
      .bind(gameId)
      .all<{
        userId: string;
        username: string;
        displayName: string;
        avatarUrl: string;
        score: number;
        updatedAt: string;
      }>();

    // Cache leaderboard at edge for 30s to protect DB
    c.header('Cache-Control', 'public, max-age=15, s-maxage=30');

    return c.json({
      gameId,
      leaderboard: rows.results || [],
    });
  } catch (err) {
    console.error('[/api/scores/leaderboard] Error:', err);
    return c.json({ leaderboard: [] });
  }
});
