import { GameFeed } from '@/components/feed/GameFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { SEED_GAMES } from '@/data/seed-games';

export default function HomePage() {
  return (
    <MobileShell>
      <AppHeader />
      <GameFeed games={SEED_GAMES} />
    </MobileShell>
  );
}
