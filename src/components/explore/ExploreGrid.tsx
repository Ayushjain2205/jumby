'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { GameTile } from './GameTile';
import { JumbyLogo } from '@/components/brand/JumbyLogo';
import { useWallet } from '@/context/WalletContext';
import { CoinShopModal } from '@/components/modals/CoinShopModal';
import { Search, Plus, Sparkles, Flame, Gamepad2, Zap, X } from 'lucide-react';

interface ExploreGridProps {
  games: Game[];
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Gamepad2 },
  { id: 'hot', label: 'Hot', icon: Flame },
  { id: 'reflexes', label: 'Reflexes', icon: Zap },
  { id: 'arcade', label: 'Arcade', icon: Gamepad2 },
  { id: 'ai', label: 'AI Made', icon: Sparkles },
];

export function ExploreGrid({ games }: ExploreGridProps) {
  const { coins, openShop } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  // Filtered games based on search and category
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = game.title.toLowerCase().includes(query);
        const matchesTags = game.tags.some((t) => t.toLowerCase().includes(query));
        const matchesCreator = game.creator.username.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTags && !matchesCreator) return false;
      }

      if (activeCategory === 'hot') {
        return game.stats.plays > 50000 || game.tags.includes('Featured');
      }
      if (activeCategory === 'reflexes') {
        return game.tags.some((t) => ['Reflexes', 'Speed', 'Dodge', 'HighSpeed'].includes(t));
      }
      if (activeCategory === 'arcade') {
        return game.tags.some((t) => ['Arcade', 'Flappy', 'Retro'].includes(t));
      }
      if (activeCategory === 'ai') {
        return game.tags.some((t) => t.toLowerCase().includes('ai'));
      }

      return true;
    });
  }, [games, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen w-full bg-jumby-ink text-white flex flex-col font-sans">
      {/* Top Header: Brand on left, Coins & Create on right */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <JumbyLogo size="sm" />
          </Link>

          {/* Right Controls: Coins + Create */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Jumby Coins Pill */}
            <button
              onClick={openShop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-jumby-lime/10 hover:bg-jumby-lime/20 border border-jumby-lime/30 text-jumby-lime font-heading font-black text-xs sm:text-sm active:scale-95 transition-all shadow-sm shadow-jumby-lime/10 cursor-pointer"
              title="Open Jumby Wallet"
            >
              <span className="text-sm">🪙</span>
              <span>{coins}</span>
              <span className="hidden sm:inline text-[11px] text-zinc-400 font-sans font-medium">Coins</span>
            </button>

            {/* Create Button */}
            <Link
              href="/create"
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-jumby-lime hover:bg-lime-300 text-zinc-950 font-black text-xs sm:text-sm transition-all active:scale-95 shadow-md shadow-jumby-lime/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Create</span>
            </Link>
          </div>
        </div>

        {/* Category Pills Bar with Compact Search */}
        <div className="max-w-7xl mx-auto mt-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Expandable Search Pill */}
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-jumby-purple/60 text-white shrink-0 animate-in fade-in zoom-in-95 duration-150">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-28 sm:w-36"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="p-0.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer"
              title="Search Games"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          )}

          {/* Category Filter Pills */}
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-jumby-purple text-white shadow-sm shadow-jumby-purple/50'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-jumby-lime' : 'text-zinc-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Friv-Style Grid Container (Natural, Clean Scroll) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3.5">
            {filteredGames.map((game, index) => (
              <GameTile key={game.id} game={game} index={index} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <span className="text-4xl">🕹️</span>
            <h3 className="font-heading font-black text-lg text-white">No games found</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              No games matched &ldquo;{searchQuery}&rdquo;. Try another search or create one in the studio!
            </p>
            <Link
              href="/create"
              className="mt-2 px-4 py-2 rounded-full bg-jumby-lime text-zinc-950 font-black text-xs transition-all active:scale-95"
            >
              + Create a Game with AI
            </Link>
          </div>
        )}
      </main>

      {/* Wallet Shop Modal */}
      <CoinShopModal />
    </div>
  );
}
