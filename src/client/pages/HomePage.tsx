import React, { useState, useEffect } from 'react';
import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { WalletProvider } from '@/context/WalletContext';
import { getAllGames } from '@/lib/games/game-registry';
import { Game } from '@/types/game';

export default function HomePage() {
  const [games, setGames] = useState<Game[]>(() => getAllGames());

  useEffect(() => {
    // Optionally re-sync published games from server
    fetch('/api/games')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.games && Array.isArray(data.games)) {
          setGames(data.games);
        }
      })
      .catch(() => {
        // Fallback to local / seed games
      });
  }, []);

  return (
    <WalletProvider>
      <ExploreGrid games={games} />
    </WalletProvider>
  );
}
