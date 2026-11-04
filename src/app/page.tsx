import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { WalletProvider } from '@/context/WalletContext';
import { getAllGames } from '@/lib/games/game-registry';

export default function HomePage() {
  const games = getAllGames();
  return (
    <WalletProvider>
      <ExploreGrid games={games} />
    </WalletProvider>
  );
}


