import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { DedicatedGamePlayer } from '@/components/game/DedicatedGamePlayer';
import { MobileShell } from '@/components/layout/MobileShell';
import { getGameBySlug } from '@/lib/games/game-registry';
import { Game } from '@/types/game';

export default function GamePermalinkPage() {
  const [, params] = useRoute('/g/:slug');
  const slug = params?.slug || '';
  const [game, setGame] = useState<Game | null>(() => (slug ? getGameBySlug(slug) || null : null));
  const [loading, setLoading] = useState(!game);

  useEffect(() => {
    if (!slug) return;
    // Check if we already have it locally
    const local = getGameBySlug(slug);
    if (local) {
      setGame(local);
      setLoading(false);
      return;
    }

    // Otherwise fetch from server /api/game?slug=...
    setLoading(true);
    fetch(`/api/game?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.game) {
          setGame(data.game);
        }
      })
      .catch((err) => console.error('Failed to load game:', err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <MobileShell>
        <div className="w-full h-full bg-[#070714] flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading game...
        </div>
      </MobileShell>
    );
  }

  if (!game) {
    return (
      <MobileShell>
        <div className="w-full h-full bg-[#070714] flex flex-col items-center justify-center p-6 text-center">
          <div className="text-4xl mb-4">👾</div>
          <h2 className="text-xl font-bold text-white mb-2">Game Not Found</h2>
          <p className="text-sm text-zinc-400 mb-6">This game may have been removed or the link is incorrect.</p>
          <a
            href="/"
            className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition"
          >
            Explore More Games
          </a>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <DedicatedGamePlayer game={game} />
    </MobileShell>
  );
}
