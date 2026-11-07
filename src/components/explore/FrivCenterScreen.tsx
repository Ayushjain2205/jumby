'use client';

import React from 'react';
import Link from 'next/link';
import { Game } from '@/types/game';
import { Play, Sparkles, Flame, Trophy, Eye } from 'lucide-react';
import { playFrivGameLaunch } from '@/lib/sound/friv-ui-sound';

import { getGameEmoji } from '@/lib/games/game-emojis';

interface FrivCenterScreenProps {
  game: Game;
  className?: string;
  isCompact?: boolean; // For mobile top banner view
}

export function FrivCenterScreen({ game, className = '', isCompact = false }: FrivCenterScreenProps) {
  const emoji = getGameEmoji(game.slug);
  const primaryTag = game.tags[0] || 'Arcade';

  const handleLaunch = () => {
    playFrivGameLaunch();
  };

  if (isCompact) {
    // Mobile / Tablet Top Preview Banner
    return (
      <Link
        href={`/g/${game.slug}`}
        onClick={handleLaunch}
        className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#1c183a] via-[#141227] to-[#1c183a] border-2 border-jumby-purple/50 hover:border-jumby-lime shadow-xl shadow-jumby-purple/20 transition-all active:scale-[0.99] overflow-hidden ${className}`}
      >
        {/* Glow ambient background */}
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-jumby-purple/20 rounded-full blur-2xl pointer-events-none group-hover:bg-jumby-lime/20 transition-colors" />

        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-md shrink-0 group-hover:scale-110 transition-transform">
            {emoji}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-jumby-lime">
                {primaryTag}
              </span>
              <span className="text-[10px] text-zinc-400">• @{game.creator.username}</span>
            </div>
            <h2 className="font-heading font-black text-base sm:text-lg text-white truncate group-hover:text-jumby-lime transition-colors">
              {game.title}
            </h2>
            <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
              {game.controlsHint || game.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0 pl-2">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-jumby-lime to-emerald-400 text-zinc-950 font-heading font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-jumby-lime/30 group-hover:scale-105 active:scale-95 transition-all">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PLAY</span>
          </div>
        </div>
      </Link>
    );
  }

  // Classic Friv Center Screen (Desktop Embedded Mosaic Hero)
  return (
    <Link
      href={`/g/${game.slug}`}
      onClick={handleLaunch}
      className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-b from-[#1d1940] via-[#120f26] to-[#0c0a1a] border-2 border-jumby-purple/60 hover:border-jumby-lime shadow-2xl shadow-jumby-purple/30 hover:shadow-jumby-lime/20 transition-all duration-300 overflow-hidden select-none cursor-pointer ${className}`}
    >
      {/* Retro Arcade CRT Scanline & Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(131,116,255,0.18),transparent_70%)] pointer-events-none group-hover:bg-[radial-gradient(circle_at_50%_40%,rgba(200,255,0,0.18),transparent_70%)] transition-colors duration-500" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-40" />

      {/* Top Header: Tag, Creator, Plays */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-jumby-purple/30 border border-jumby-purple/50 text-[11px] font-black uppercase tracking-wider text-jumby-lime">
            <Flame className="w-3 h-3 text-jumby-lime" />
            {primaryTag}
          </span>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
            @{game.creator.username}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>{(game.stats.plays / 1000).toFixed(0)}k</span>
          </div>
          {game.stats.highScore && (
            <div className="flex items-center gap-1 text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              <span>{game.stats.highScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Hero Visual: Floating Large Emoji & Title */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 text-center">
        <div className="relative mb-2">
          <div className="absolute -inset-4 bg-jumby-lime/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-6xl sm:text-7xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)] group-hover:scale-115 transition-transform duration-300 inline-block">
            {emoji}
          </span>
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight drop-shadow-md group-hover:text-jumby-lime transition-colors">
          {game.title}
        </h2>

        <p className="text-xs text-zinc-300 max-w-sm mt-1 line-clamp-1">
          {game.description}
        </p>

        {/* Controls Hint */}
        {game.controlsHint && (
          <div className="mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400 font-medium">
            🎮 {game.controlsHint}
          </div>
        )}
      </div>

      {/* Bottom Action Footer: Big Pulsing PLAY Button */}
      <div className="relative z-10 flex items-center justify-center pt-2">
        <div className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-jumby-lime via-[#baff29] to-emerald-400 hover:from-white hover:to-jumby-lime text-zinc-950 font-heading font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-xl shadow-jumby-lime/30 group-hover:shadow-jumby-lime/50 group-hover:scale-105 active:scale-95 transition-all">
          <Play className="w-5 h-5 fill-current text-zinc-950" />
          <span>PLAY NOW</span>
        </div>
      </div>

      {/* Gloss overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Link>
  );
}
