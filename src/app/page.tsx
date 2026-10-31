import { GameFeed } from '@/components/feed/GameFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { SEED_GAMES } from '@/data/seed-games';

export default function HomePage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <AppHeader />
      <GameFeed games={SEED_GAMES} />
    </main>
  );
}
