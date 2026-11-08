'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { GameTile } from './GameTile';
import { JumbyLogo } from '@/components/brand/JumbyLogo';
import { JumbyCoin } from '@/components/brand/JumbyCoin';
import { useWallet } from '@/context/WalletContext';
import { CoinShopModal } from '@/components/modals/CoinShopModal';
import {
  Search,
  Plus,
  Sparkles,
  Flame,
  Gamepad2,
  Zap,
  X,
  Play,
  Bell,
  ChevronDown,
} from 'lucide-react';

interface ExploreGridProps {
  games: Game[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: Gamepad2 },
  { id: 'hot', label: 'Hot Arcade', icon: Flame },
  { id: 'reflexes', label: 'Reflexes & Speed', icon: Zap },
  { id: 'arcade', label: 'Retro Classics', icon: Gamepad2 },
  { id: 'sports', label: 'Sports & Action', icon: Sparkles },
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
        return (
          game.stats.plays > 90000 ||
          game.tags.includes('Featured') ||
          game.tags.includes('Hardcore')
        );
      }
      if (activeCategory === 'reflexes') {
        return game.tags.some((t) =>
          ['Reflexes', 'Speed', 'Dodge', 'HighSpeed', 'Gravity', 'Fast'].includes(t)
        );
      }
      if (activeCategory === 'arcade') {
        return game.tags.some((t) =>
          ['Arcade', 'Flappy', 'Retro', 'Classic', '8Bit'].includes(t)
        );
      }
      if (activeCategory === 'sports') {
        return game.tags.some((t) =>
          ['Sports', 'Racing', 'Combat', 'Action', 'Flyer'].includes(t)
        );
      }

      return true;
    });
  }, [games, searchQuery, activeCategory]);

  // Full Wall Generator: Repeats games to produce an unbroken, massive arcade wall of tiles
  const wallGames = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredGames;
    }

    if (filteredGames.length === 0) return [];

    // For full wall: guarantee at least 120 tiles (12 cols x 10 rows or 10 cols x 12 rows)
    const targetCount = activeCategory === 'all' ? 120 : 60;
    const result: Game[] = [];
    while (result.length < targetCount) {
      result.push(...filteredGames);
    }
    return result.slice(0, targetCount);
  }, [filteredGames, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen w-full bg-[#0d0b1a] text-white flex flex-col font-sans select-none">
      {/* Top Header: Brand & Navigation on left, Coins & Profile on right */}
      <header className="sticky top-0 z-40 bg-[#120f26]/95 backdrop-blur-xl border-b border-white/5 px-3 sm:px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="shrink-0 flex items-center">
              <JumbyLogo size="sm" />
            </Link>

            <div className="h-5 w-px bg-white/15 hidden sm:block" />

            <nav className="flex items-center gap-1 sm:gap-1.5">
              {/* Active Play */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-jumby-purple to-[#8374ff] text-white font-sans font-bold text-xs shadow-md shadow-jumby-purple/30 cursor-default">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </div>

              {/* Create Pill */}
              <Link
                href="/create"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-jumby-purple hover:text-white text-zinc-300 font-heading font-black text-xs transition-all active:scale-95"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-jumby-lime" />
                <span>Create</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls: Notifications, Coins, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bell Notification */}
            <button
              type="button"
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Jumby Coins Pill with Plus */}
            <button
              onClick={openShop}
              className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full bg-[#1b1935] hover:bg-[#25224a] border border-white/10 text-white font-heading font-black text-xs shadow-inner transition-all active:scale-95 cursor-pointer"
              title="Open Jumby Wallet"
            >
              <JumbyCoin size="md" className="h-5.5 w-auto" />
              <span>{coins ? coins.toLocaleString() : '2,450'}</span>
              <Plus className="w-3 h-3 text-zinc-400 stroke-[3]" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-1 pl-1 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-jumby-purple to-jumby-lime p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <img
                    src="/images/agent-avatar.jpg"
                    alt="User Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Category Pills Bar with Compact Search */}
        <div className="max-w-[1600px] mx-auto mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Expandable Search Pill */}
          {isSearchOpen ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-jumby-purple/60 text-white shrink-0 animate-in fade-in zoom-in-95 duration-150">
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-36 sm:w-48"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
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
                    ? 'bg-jumby-purple text-white shadow-md shadow-jumby-purple/40 ring-1 ring-white/20'
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

      {/* Main Full Arcade Wall (Pure Dense Grid, No Center Box) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-2 sm:p-3 md:p-4 flex flex-col">
        {wallGames.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-1.5 sm:gap-2 md:gap-2.5">
            {wallGames.map((game, index) => (
              <GameTile
                key={`${game.id}-${index}`}
                game={game}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <span className="text-5xl">🕹️</span>
            <h3 className="font-heading font-black text-xl text-white">No games found</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              No games matched &ldquo;{searchQuery}&rdquo;. Try another search or create one instantly with AI!
            </p>
            <Link
              href="/create"
              className="mt-3 px-5 py-2.5 rounded-full bg-jumby-lime text-zinc-950 font-heading font-black text-xs shadow-lg shadow-jumby-lime/30 hover:scale-105 active:scale-95 transition-all"
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
