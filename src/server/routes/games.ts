import { Hono } from 'hono';
import { CloudflareEnv, AppVariables } from '../types';
import { Game } from '@/types/game';
import { SEED_GAMES } from '@/data/seed-games';
import { validateAndHealGameHtml } from '@/lib/ai/game-healer';

export const gamesRouter = new Hono<{ Bindings: CloudflareEnv; Variables: AppVariables }>();

// GET /api/games - List all published games
gamesRouter.get('/', async (c) => {
  const db = c.env.DB;

  if (!db) {
    return c.json({ games: SEED_GAMES });
  }

  try {
    const rows = await db
      .prepare(`
        SELECT 
          id, slug, title, description, prompt,
          creator_id, creator_name, creator_avatar,
          parent_game_id, engine, current_version,
          r2_bundle_path, thumbnail_url,
          plays, likes, remixes, created_at
        FROM games
        ORDER BY plays DESC, created_at DESC
        LIMIT 50
      `)
      .all<any>();

    const dbGames: Game[] = (rows.results || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description || '',
      prompt: row.prompt || '',
      creator: {
        id: row.creator_id,
        name: row.creator_name,
        username: row.creator_name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        avatar: row.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.slug}`,
      },
      parentGameId: row.parent_game_id || null,
      parentGameTitle: null,
      engine: (row.engine as any) || 'canvas2d',
      bundleUrl: `/api/game/bundle/${row.slug}`,
      thumbnailUrl: row.thumbnail_url || undefined,
      stats: {
        plays: row.plays || 0,
        likes: row.likes || 0,
        remixes: row.remixes || 0,
      },
      tags: ['AI Generated'],
      controlsHint: 'Tap or Space to Play',
      createdAt: row.created_at,
    }));

    // Deduplicate against SEED_GAMES
    const existingSlugs = new Set(dbGames.map((g) => g.slug));
    const mergedGames = [...dbGames, ...SEED_GAMES.filter((sg) => !existingSlugs.has(sg.slug))];

    return c.json({ games: mergedGames });
  } catch (err) {
    console.error('[GET /api/games] Error querying D1:', err);
    return c.json({ games: SEED_GAMES });
  }
});

// GET /api/game?slug=... - Fetch game metadata and HTML bundle
gamesRouter.get('/single', async (c) => {
  const slug = c.req.query('slug');
  if (!slug) {
    return c.json({ error: 'Slug parameter is required' }, 400);
  }

  const db = c.env.DB;
  const bucket = c.env.GAMES_BUCKET;

  let gameMeta: Game | null = null;
  let htmlCode: string | null = null;

  // 1. Check D1 Database
  if (db) {
    try {
      const row = await db
        .prepare(`
          SELECT 
            id, slug, title, description, prompt,
            creator_id, creator_name, creator_avatar,
            parent_game_id, engine, current_version,
            r2_bundle_path, thumbnail_url,
            plays, likes, remixes, created_at
          FROM games
          WHERE slug = ?
        `)
        .bind(slug)
        .first<any>();

      if (row) {
        gameMeta = {
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description || '',
          prompt: row.prompt || '',
          creator: {
            id: row.creator_id,
            name: row.creator_name,
            username: row.creator_name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            avatar: row.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.slug}`,
          },
          parentGameId: row.parent_game_id || null,
          engine: (row.engine as any) || 'canvas2d',
          bundleUrl: `/api/game/bundle/${row.slug}`,
          thumbnailUrl: row.thumbnail_url || undefined,
          stats: {
            plays: row.plays || 0,
            likes: row.likes || 0,
            remixes: row.remixes || 0,
          },
          tags: ['AI Generated'],
          controlsHint: 'Tap or Space to Play',
          createdAt: row.created_at,
        };

        // Fetch bundle from R2
        if (bucket && row.r2_bundle_path) {
          const r2Object = await bucket.get(row.r2_bundle_path);
          if (r2Object) {
            htmlCode = await r2Object.text();
          }
        }
      }
    } catch (err) {
      console.warn('[GET /api/game/single] D1 query failed:', err);
    }
  }

  // 2. Fallback to SEED_GAMES
  if (!gameMeta) {
    const seed = SEED_GAMES.find((g) => g.slug === slug);
    if (seed) {
      gameMeta = seed;
    }
  }

  // 3. Fallback bundle retrieval
  if (!htmlCode && gameMeta) {
    // If running in development or assets present
    if (c.env.ASSETS) {
      try {
        const assetRes = await c.env.ASSETS.fetch(new Request(`https://local/games/${slug}/index.html`));
        if (assetRes.ok) {
          htmlCode = await assetRes.text();
        }
      } catch {
        // Ignored
      }
    }
  }

  if (!gameMeta) {
    return c.json({ error: `Game '${slug}' not found` }, 404);
  }

  return c.json({
    success: true,
    game: gameMeta,
    html: htmlCode || '',
  });
});

// GET /api/game/bundle/:slug - Serves raw HTML from R2 with text/html content-type
gamesRouter.get('/bundle/:slug', async (c) => {
  const slug = c.req.param('slug');
  const bucket = c.env.GAMES_BUCKET;

  if (bucket) {
    const r2Key = `games/${slug}/index.html`;
    const r2Obj = await bucket.get(r2Key);
    if (r2Obj) {
      const html = await r2Obj.text();
      return c.html(html);
    }
  }

  // Fallback to static asset if in assets
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    if (res.ok) return res;
  }

  return c.text('Game bundle not found', 404);
});

// POST /api/publish - Multi-user publish: In-place edit for owner, auto-fork for others
gamesRouter.post('/publish', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const {
      title = 'Untitled Game',
      html,
      archetype = 'arcade',
      prompt = '',
      editSlug,
      isEdit,
    } = body;

    if (!html || typeof html !== 'string') {
      return c.json({ error: 'Game HTML code is required' }, 400);
    }

    const user = c.get('user');
    const db = c.env.DB;
    const bucket = c.env.GAMES_BUCKET;

    // Auto-heal game HTML before saving
    const healingResult = validateAndHealGameHtml(html, { prompt, archetype });
    const finalHtmlToPublish = healingResult.html;

    // Check if editing an existing game
    if (editSlug && (isEdit || editSlug.trim().length > 0)) {
      const targetSlug = editSlug.trim();
      let existingRecord: any = null;

      if (db) {
        existingRecord = await db
          .prepare('SELECT id, slug, creator_id, current_version, plays, likes, remixes, title FROM games WHERE slug = ?')
          .bind(targetSlug)
          .first();
      }

      // Check ownership: Is this user the original author?
      const isOwner = existingRecord && existingRecord.creator_id === user.id;

      if (isOwner) {
        // ----------------------------------------
        // 1. IN-PLACE EDIT MODE (Owner Only)
        // ----------------------------------------
        const nextVersion = (existingRecord.current_version || 1) + 1;
        const r2Path = `games/${targetSlug}/index.html`;
        const r2VersionPath = `games/${targetSlug}/v${nextVersion}/index.html`;

        if (bucket) {
          await bucket.put(r2Path, finalHtmlToPublish, {
            httpMetadata: { contentType: 'text/html' },
          });
          await bucket.put(r2VersionPath, finalHtmlToPublish, {
            httpMetadata: { contentType: 'text/html' },
          });
        }

        if (db) {
          // Log immutable version history
          await db
            .prepare(`
              INSERT INTO game_versions (id, game_id, version, prompt, r2_path)
              VALUES (?, ?, ?, ?, ?)
            `)
            .bind(`ver_${Date.now()}`, existingRecord.id, nextVersion, prompt, r2VersionPath)
            .run();

          // Update game record
          await db
            .prepare(`
              UPDATE games
              SET title = ?, description = ?, prompt = ?, current_version = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(title, prompt, prompt, nextVersion, existingRecord.id)
            .run();
        }

        return c.json({
          success: true,
          slug: targetSlug,
          url: `/g/${targetSlug}`,
          isUpdate: true,
          version: nextVersion,
          message: 'Game updated in-place successfully',
        });
      } else {
        // ----------------------------------------
        // 2. FORK / REMIX MODE (Non-owner or guest)
        // ----------------------------------------
        const baseSlug = title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'micro-game';
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const forkSlug = `${baseSlug}-${randomSuffix}`;
        const newGameId = `game_${Date.now()}_${randomSuffix}`;
        const r2Path = `games/${forkSlug}/index.html`;

        if (bucket) {
          await bucket.put(r2Path, finalHtmlToPublish, {
            httpMetadata: { contentType: 'text/html' },
          });
        }

        if (db) {
          // Increment remixes count on parent game
          if (existingRecord) {
            await db
              .prepare('UPDATE games SET remixes = remixes + 1 WHERE id = ?')
              .bind(existingRecord.id)
              .run();
          }

          // Insert new forked game
          await db
            .prepare(`
              INSERT INTO games (
                id, slug, title, description, prompt,
                creator_id, creator_name, creator_avatar,
                parent_game_id, engine, current_version,
                r2_bundle_path, plays, likes, remixes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'canvas2d', 1, ?, 1, 1, 0)
            `)
            .bind(
              newGameId,
              forkSlug,
              title,
              prompt || `${title} (Remixed)`,
              prompt,
              user.id,
              user.displayName,
              user.avatarUrl,
              existingRecord?.id || null,
              r2Path
            )
            .run();
        }

        return c.json({
          success: true,
          slug: forkSlug,
          url: `/g/${forkSlug}`,
          isRemix: true,
          parentTitle: existingRecord?.title || null,
          message: `Created new remix of ${existingRecord?.title || 'game'}`,
        });
      }
    }

    // ----------------------------------------
    // 3. NEW GAME PUBLISH
    // ----------------------------------------
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'micro-game';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;
    const newGameId = `game_${Date.now()}_${randomSuffix}`;
    const r2Path = `games/${slug}/index.html`;

    if (bucket) {
      await bucket.put(r2Path, finalHtmlToPublish, {
        httpMetadata: { contentType: 'text/html' },
      });
    }

    if (db) {
      await db
        .prepare(`
          INSERT INTO games (
            id, slug, title, description, prompt,
            creator_id, creator_name, creator_avatar,
            parent_game_id, engine, current_version,
            r2_bundle_path, plays, likes, remixes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'canvas2d', 1, ?, 1, 1, 0)
        `)
        .bind(
          newGameId,
          slug,
          title,
          prompt || `${title} - Created with Jumby`,
          prompt,
          user.id,
          user.displayName,
          user.avatarUrl,
          r2Path
        )
        .run();
    }

    return c.json({
      success: true,
      slug,
      url: `/g/${slug}`,
      isNew: true,
    });
  } catch (error: any) {
    console.error('[/api/publish] Error:', error);
    return c.json({ error: error.message || 'Failed to publish game' }, 500);
  }
});
