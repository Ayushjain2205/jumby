import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { CloudflareEnv, AppVariables } from './types';
import { authMiddleware } from './auth/middleware';
import { authRouter } from './routes/auth';
import { gamesRouter } from './routes/games';
import { generateRouter } from './routes/generate';
import { healRouter } from './routes/heal';
import { scoresRouter } from './routes/scores';
import { SEED_GAMES } from '@/data/seed-games';

const app = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

app.use('*', cors());
app.use('*', authMiddleware);

// Health check endpoint
app.get('/api/health', (c) => {
  const user = c.get('user');
  return c.json({
    status: 'ok',
    environment: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
    user,
  });
});

// Auth endpoints
app.route('/api/auth', authRouter);

// Games & Publishing endpoints
app.route('/api/games', gamesRouter);
app.get('/api/game', (c) => gamesRouter.fetch(new Request(new URL(`/api/games/single?${c.req.query('slug') ? 'slug=' + c.req.query('slug') : ''}`, c.req.url)), c.env));
app.post('/api/publish', (c) => gamesRouter.fetch(new Request(new URL('/api/games/publish', c.req.url), { method: 'POST', body: c.req.raw.body, headers: c.req.raw.headers }), c.env));

// High Scores & Leaderboard endpoints (Technique 1: Client-Side PB Gate)
app.route('/api/scores', scoresRouter);

// AI Engine endpoints
app.route('/api/generate', generateRouter);
app.route('/api/heal', healRouter);

// Edge SEO Interceptor for /g/:slug (WhatsApp, Twitter/X, Discord, Googlebot)
app.get('/g/:slug', async (c, next) => {
  const slug = c.req.param('slug');
  const db = c.env.DB;

  let gameMeta: { title: string; description: string; thumbnail_url?: string; creator_name: string } | null = null;

  if (db) {
    try {
      gameMeta = await db
        .prepare('SELECT title, description, thumbnail_url, creator_name FROM games WHERE slug = ?')
        .bind(slug)
        .first();
    } catch {
      // Ignored
    }
  }

  if (!gameMeta) {
    const seed = SEED_GAMES.find((g) => g.slug === slug);
    if (seed) {
      gameMeta = {
        title: seed.title,
        description: seed.description,
        thumbnail_url: seed.thumbnailUrl,
        creator_name: seed.creator.name,
      };
    }
  }

  if (gameMeta && c.env.ASSETS) {
    try {
      const indexRes = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)));
      if (indexRes.ok) {
        const indexHtml = await indexRes.text();
        const seoTags = `
          <title>${gameMeta.title} by @${gameMeta.creator_name} - Play on Jumby</title>
          <meta name="description" content="${gameMeta.description}" />
          <meta property="og:title" content="${gameMeta.title} | Jumby Micro-Games" />
          <meta property="og:description" content="${gameMeta.description}" />
          <meta property="og:image" content="${gameMeta.thumbnail_url || 'https://jumby.app/favicon.ico'}" />
          <meta property="og:url" content="${c.req.url}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${gameMeta.title} - Play on Jumby" />
          <meta name="twitter:description" content="${gameMeta.description}" />
          <meta name="twitter:image" content="${gameMeta.thumbnail_url || 'https://jumby.app/favicon.ico'}" />
        `;
        const enrichedHtml = indexHtml.replace('<!-- JUMBY_SEO_INJECTION -->', seoTags);
        return c.html(enrichedHtml);
      }
    } catch (err) {
      console.warn('[SEO Interceptor] Asset fetch failed:', err);
    }
  }

  return next();
});

export default app;
