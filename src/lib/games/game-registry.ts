import { Game } from '@/types/game';
import { SEED_GAMES } from '@/data/seed-games';

export function getPublishedGames(): Game[] {
  // In client/browser environment, published games are fetched from API
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('jumby_local_published_games');
      if (stored) return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function savePublishedGame(game: Game): void {
  if (typeof window !== 'undefined') {
    try {
      const existing = getPublishedGames();
      const updated = [game, ...existing.filter((g) => g.id !== game.id && g.slug !== game.slug)];
      localStorage.setItem('jumby_local_published_games', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving published game to local storage:', err);
    }
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
