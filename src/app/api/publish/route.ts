import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Game } from '@/types/game';
import { savePublishedGame } from '@/lib/games/game-registry';
import { validateAndHealGameHtml } from '@/lib/ai/game-healer';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title = 'Untitled Game',
      html,
      archetype = 'arcade',
      prompt = '',
      creatorName = 'Creator',
      creatorUsername = 'creator',
    } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Game HTML code is required' }, { status: 400 });
    }

    // Auto-heal game HTML before writing to disk
    const healingResult = validateAndHealGameHtml(html, { prompt, archetype });
    const finalHtmlToPublish = healingResult.html;

    // Generate safe clean slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'micro-game';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    // 1. Write game bundle to public/games/<slug>/index.html
    const targetDir = path.join(process.cwd(), 'public', 'games', slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetHtmlPath = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetHtmlPath, finalHtmlToPublish, 'utf-8');

    // 2. Create game metadata record
    const newGame: Game = {
      id: `game_${Date.now()}_${randomSuffix}`,
      slug,
      title,
      description: prompt || `${title} - Created with Jumby AI Studio`,
      prompt: prompt || title,
      creator: {
        id: 'usr_me',
        name: creatorName,
        username: creatorUsername,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${slug}`,
      },
      parentGameId: null,
      parentGameTitle: null,
      engine: 'canvas2d',
      bundleUrl: `/games/${slug}/index.html`,
      stats: {
        plays: 1,
        likes: 1,
        remixes: 0,
        highScore: 0,
      },
      tags: ['AI Generated', archetype, 'New'],
      controlsHint: 'Tap or Space to Play',
      createdAt: new Date().toISOString(),
    };

    savePublishedGame(newGame);

    return NextResponse.json({
      success: true,
      slug,
      url: `/g/${slug}`,
      game: newGame,
    });
  } catch (error: any) {
    console.error('[/api/publish] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish game' },
      { status: 500 }
    );
  }
}
