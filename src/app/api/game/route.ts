import { NextRequest, NextResponse, connection } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getGameBySlug } from '@/lib/games/game-registry';

export async function GET(req: NextRequest) {
  await connection();
  try {
    const slug = req.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const game = getGameBySlug(slug);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Try reading index.html inside the slug directory
    const dirHtmlPath = path.join(process.cwd(), 'public', 'games', slug, 'index.html');
    const flatHtmlPath = path.join(process.cwd(), 'public', 'games', `${slug}.html`);

    let html = '';
    if (fs.existsSync(dirHtmlPath)) {
      html = fs.readFileSync(dirHtmlPath, 'utf-8');
    } else if (fs.existsSync(flatHtmlPath)) {
      html = fs.readFileSync(flatHtmlPath, 'utf-8');
    } else if (game.bundleUrl) {
      // Relative path resolution
      const resolved = path.join(process.cwd(), 'public', game.bundleUrl.replace(/^\//, ''));
      if (fs.existsSync(resolved)) {
        html = fs.readFileSync(resolved, 'utf-8');
      }
    }

    return NextResponse.json({
      game,
      html,
    });
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    console.error('[/api/game] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch game' }, { status: 500 });
  }
}
