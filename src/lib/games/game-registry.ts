import fs from 'fs';
import path from 'path';
import { Game } from '@/types/game';
import { SEED_GAMES } from '@/data/seed-games';

const PUBLISHED_GAMES_FILE = path.join(process.cwd(), 'src/data/published-games.json');

export function getPublishedGames(): Game[] {
  try {
    if (fs.existsSync(PUBLISHED_GAMES_FILE)) {
      const content = fs.readFileSync(PUBLISHED_GAMES_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading published games file:', err);
  }
  return [];
}

export function savePublishedGame(game: Game): void {
  try {
    const existing = getPublishedGames();
    const updated = [game, ...existing.filter((g) => g.id !== game.id && g.slug !== game.slug)];
    fs.writeFileSync(PUBLISHED_GAMES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing published game:', err);
  }
}

export function getAllGames(): Game[] {
  const published = getPublishedGames();
  return [...published, ...SEED_GAMES];
}

export function getGameBySlug(slug: string): Game | undefined {
  const all = getAllGames();
  return all.find((g) => g.slug === slug);
}
