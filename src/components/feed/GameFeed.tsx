'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Game } from '@/types/game';
import { GameCard } from './GameCard';
import { ChevronDown } from 'lucide-react';

interface GameFeedProps {
  games: Game[];
  initialSlug?: string;
}

export function GameFeed({ games, initialSlug }: GameFeedProps) {
  // Find initial index from slug if provided
  const initialIndex = initialSlug
    ? Math.max(0, games.findIndex((g) => g.slug === initialSlug))
    : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync browser URL silently when active game changes
  useEffect(() => {
    const activeGame = games[currentIndex];
    if (activeGame && typeof window !== 'undefined') {
      const targetUrl = `/g/${activeGame.slug}`;
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState({ gameId: activeGame.id }, '', targetUrl);
      }
    }
  }, [currentIndex, games]);

  // Scroll event listener with IntersectionObserver or scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const height = container.clientHeight;
        const scrollTop = container.scrollTop;
        const newIndex = Math.round(scrollTop / height);
        if (newIndex >= 0 && newIndex < games.length && newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
        }
      }, 60);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [currentIndex, games.length]);

  // Keyboard navigation (ArrowDown / ArrowUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, games.length]);

  const scrollToIndex = (index: number) => {
    if (index < 0 || index >= games.length || !containerRef.current) return;
    const height = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * height,
      behavior: 'smooth',
    });
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Snap-scroll container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollSnapStop: 'always' }}
      >
        {games.map((game, index) => {
          // Render window: only keep active card and immediate neighbors mounted
          const isNearby = Math.abs(index - currentIndex) <= 1;

          return (
            <div
              key={game.id}
              className="relative w-full h-full snap-start snap-always shrink-0 flex items-center justify-center"
            >
              {isNearby ? (
                <GameCard
                  game={game}
                  isActive={index === currentIndex}
                />
              ) : (
                // Standby placeholder when outside window to preserve memory
                <div className="w-full h-full bg-[#070714] flex items-center justify-center text-zinc-600 font-mono text-xs">
                  {game.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Swipe Up Hint on first game */}
      {currentIndex === 0 && (
        <div
          onClick={() => scrollToIndex(1)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-0.5 text-white/70 hover:text-white cursor-pointer pointer-events-auto transition-all animate-bounce"
        >
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">Swipe Up</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
