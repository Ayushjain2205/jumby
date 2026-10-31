import { GameFeed } from '@/components/feed/GameFeed';
import { MobileShell } from '@/components/layout/MobileShell';
import { SEED_GAMES } from '@/data/seed-games';

export default function HomePage() {
  return (
    <MobileShell>
      <GameFeed games={SEED_GAMES} />
    </MobileShell>
  );
}
