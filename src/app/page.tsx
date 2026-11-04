import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { getAllGames } from '@/lib/games/game-registry';

export default function HomePage() {
  const games = getAllGames();
  return <ExploreGrid games={games} />;
}

