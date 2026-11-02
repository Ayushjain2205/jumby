import { GameFeed } from '@/components/feed/GameFeed';
import { MobileShell } from '@/components/layout/MobileShell';
import { getAllGames } from '@/lib/games/game-registry';


export default function HomePage() {
  const games = getAllGames();
  return (
    <MobileShell>
      <GameFeed games={games} />
    </MobileShell>
  );
}
