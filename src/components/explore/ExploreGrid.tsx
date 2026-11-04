'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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

  // Multiply games to create a rich 2D diagonal explore canvas if count is small
  const displayTiles = useMemo(() => {
    if (filteredGames.length === 0) return [];
    if (filteredGames.length >= 24) return filteredGames;
    // Repeat games 2-3x to form an expansive 2D surface for diagonal sliding
    const repeated: Game[] = [];
    const multiplier = Math.ceil(28 / filteredGames.length);
    for (let i = 0; i < multiplier; i++) {
      filteredGames.forEach((g) => {
        repeated.push({ ...g, id: `${g.id}_rep_${i}` });
      });
    }
    return repeated;
  }, [filteredGames]);

  // 2D Pan / Sliding Scroll State & Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Clamp offset to bounds
  const clampOffset = useCallback((x: number, y: number) => {
    if (!viewportRef.current || !contentRef.current) return { x, y };
    const vp = viewportRef.current.getBoundingClientRect();
    const cp = contentRef.current.getBoundingClientRect();

    const minX = Math.min(0, vp.width - cp.width - 32);
    const minY = Math.min(0, vp.height - cp.height - 32);

    return {
      x: Math.max(minX, Math.min(32, x)),
      y: Math.max(minY, Math.min(32, y)),
    };
  }, []);

  // Momentum coasting animation
  const startMomentum = useCallback(() => {
    const decay = () => {
      velocityRef.current.vx *= 0.93;
      velocityRef.current.vy *= 0.93;

      if (
        Math.abs(velocityRef.current.vx) < 0.1 &&
        Math.abs(velocityRef.current.vy) < 0.1
      ) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      setOffset((prev) => {
        const nextX = prev.x + velocityRef.current.vx;
        const nextY = prev.y + velocityRef.current.vy;
        return clampOffset(nextX, nextY);
      });

      animationFrameRef.current = requestAnimationFrame(decay);
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(decay);
  }, [clampOffset]);

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { vx: 0, vy: 0 };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;

    dragDistanceRef.current += Math.hypot(dx, dy);
    velocityRef.current = { vx: dx, vy: dy };
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy));
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startMomentum();
  };

  // Touch Events (Mobile 2D diagonal panning)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const touch = e.touches[0];
    isDraggingRef.current = true;
    dragDistanceRef.current = 0;
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    lastPosRef.current = { x: touch.clientX, y: touch.clientY };
    velocityRef.current = { vx: 0, vy: 0 };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lastPosRef.current.x;
    const dy = touch.clientY - lastPosRef.current.y;

    dragDistanceRef.current += Math.hypot(dx, dy);
    velocityRef.current = { vx: dx, vy: dy };
    lastPosRef.current = { x: touch.clientX, y: touch.clientY };

    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy));
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    startMomentum();
  };

  // Trackpad / Wheel 2D Diagonal Scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const dx = -e.deltaX;
    const dy = -e.deltaY;

    setOffset((prev) => clampOffset(prev.x + dx, prev.y + dy));
  };

  // Click handler on tile: if moved less than 6px, navigate to game
  const handleTileSelect = (slug: string) => {
    if (dragDistanceRef.current < 6) {
      router.push(`/g/${slug}`);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-jumby-ink text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header: Brand on left, Jumby Coins & Create on right (clean, no large search bar) */}
      <header className="shrink-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <JumbyLogo size="sm" />
        </Link>

        {/* Right Section: Jumby Coins + Create Button */}
        <div className="flex items-center gap-3">
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
            <span>Create</span>
          </Link>
        </div>
      </header>

      {/* Category Pills Bar with Compact Search Icon */}
      <div className="shrink-0 z-30 bg-zinc-950/70 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Search Icon / Expandable Search Pill */}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs font-bold transition-all shrink-0 active:scale-95"
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

      {/* 2D Sliding Diagonal Scroll Area */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing touch-none select-none bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]"
      >
        {displayTiles.length > 0 ? (
          <div
            ref={contentRef}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              willChange: 'transform',
            }}
            className="p-4 sm:p-8 inline-grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4 transition-transform duration-75 ease-out"
          >
            {displayTiles.map((game, index) => (
              <div
                key={game.id}
                onClick={() => handleTileSelect(game.slug)}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0"
              >
                <GameTile game={game} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">🕹️</span>
            <h3 className="font-heading font-black text-lg text-white">No games found</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              No games matched &ldquo;{searchQuery}&rdquo;. Try another search or create one in the studio!
            </p>
          </div>
        )}

        {/* Diagonal Sliding Scroll Hint (Fades nicely) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 shadow-lg">
          <span>↔ ↕</span>
          <span>Slide in any direction to explore</span>
        </div>
      </div>

      {/* Wallet Shop Modal */}
      <CoinShopModal />
    </div>
  );
}
